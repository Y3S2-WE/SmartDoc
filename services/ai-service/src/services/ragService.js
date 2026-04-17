'use strict';

const fs = require('fs');
const path = require('path');
const HealthDocument = require('../models/HealthDocument');
const DocumentChunk = require('../models/DocumentChunk');
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

// ─── Constants ────────────────────────────────────────────────────────────────
const HF_TOKEN = process.env.HF_ACCESS_TOKEN;
const EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBED_DIMS = 384;
const GENERATION_MODEL = 'Qwen/Qwen2.5-72B-Instruct';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 5;

// ─── Text Chunking ────────────────────────────────────────────────────────────

/**
 * Split text into overlapping chunks for better retrieval coverage.
 */
function chunkText(text) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

// ─── HuggingFace Embeddings ───────────────────────────────────────────────────

/**
 * Get embeddings from HuggingFace Inference API.
 * Batches up to 64 texts at a time.
 */
async function getEmbeddings(texts) {
  try {
    const data = await hf.featureExtraction({
      model: EMBED_MODEL,
      inputs: texts
    });

    // HF returns [[...dims]] for multiple inputs
    // For single sentence-transformers: data = [[dims], [dims], ...]
    if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      return data.map((item) => item[0]);
    }
    return data;
  } catch (error) {
    throw new Error(`HuggingFace embedding error: ${error.message}`);
  }
}

// ─── Document Parsing ─────────────────────────────────────────────────────────

async function extractTextFromPDF(filePath) {
  // Dynamic import to avoid top-level require issues with pdf-parse
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractTextFromDOCX(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// ─── Main RAG Functions ───────────────────────────────────────────────────────

/**
 * Parse, chunk, embed and store a document in MongoDB Atlas Vector Search.
 * Called after admin uploads a file.
 */
async function embedAndStore(filePath, fileType, docId) {
  let rawText = '';

  if (fileType === 'pdf') {
    rawText = await extractTextFromPDF(filePath);
  } else if (fileType === 'docx') {
    rawText = await extractTextFromDOCX(filePath);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Document appears to be empty or unreadable.');
  }

  // Remove existing chunks for this document (in case of re-processing)
  await DocumentChunk.deleteMany({ documentId: docId });

  const chunks = chunkText(rawText);
  if (chunks.length === 0) throw new Error('No valid chunks extracted from document.');

  // Embed in batches of 32 to stay within HF API limits
  const BATCH_SIZE = 32;
  const allChunkDocs = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await getEmbeddings(batch);

    for (let j = 0; j < batch.length; j++) {
      allChunkDocs.push({
        documentId: docId,
        chunkIndex: i + j,
        content: batch[j],
        embedding: embeddings[j],
        metadata: {
          filename: path.basename(filePath),
          chunkSize: batch[j].length
        }
      });
    }
  }

  await DocumentChunk.insertMany(allChunkDocs);

  return allChunkDocs.length;
}

// ─── Atlas Vector Search ──────────────────────────────────────────────────────

/**
 * Retrieve top-K most relevant chunks using MongoDB Atlas $vectorSearch.
 */
async function retrieveRelevantChunks(queryEmbedding) {
  const indexName = process.env.ATLAS_VECTOR_INDEX || 'vector_index';

  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: indexName,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: TOP_K * 10,
        limit: TOP_K
      }
    },
    {
      $project: {
        content: 1,
        score: { $meta: 'vectorSearchScore' },
        _id: 0
      }
    }
  ]);

  return results;
}

// ─── LLM Generation ──────────────────────────────────────────────────────────

/**
 * Generate a structured medical response using Mistral-7B-Instruct via HF Inference API.
 */
async function generateMedicalResponse(symptoms, contextChunks) {
  const contextText = contextChunks.map((c) => c.content).join('\n\n---\n\n');

  const prompt = `You are a knowledgeable medical assistant AI helping patients understand their symptoms. You provide preliminary guidance only — NOT a diagnosis or a replacement for professional medical care.

Use the following reference medical documents to inform your response. If the documents mention specific doctors along with their specialties, extract their names and include them in the doctor_recommendations.

--- MEDICAL CONTEXT ---
${contextText}
--- END CONTEXT ---

A patient is experiencing the following symptoms:
${symptoms.map((s) => `• ${s}`).join('\n')}

Based on the medical context above, provide a structured response in the EXACT JSON format below. Do not include any text outside the JSON:

{
  "preliminary_suggestions": [
    "Suggestion 1 about the likely cause or condition",
    "Suggestion 2 about the likely cause or condition"
  ],
  "urgency_level": "low" | "medium" | "high" | "emergency",
  "urgency_explanation": "Brief explanation of why this urgency level was assigned",
  "doctor_recommendations": [
    {
      "specialty": "Doctor specialty type",
      "doctor_name": "Specific doctor name found in the context (if available, otherwise omit)",
      "reason": "Why this specialist is recommended"
    }
  ],
  "self_care_tips": [
    "Self-care tip 1",
    "Self-care tip 2"
  ],
  "disclaimer": "This is preliminary AI-generated guidance only. Please consult a qualified healthcare professional for actual diagnosis and treatment."
}
`;

  let rawText = '';
  try {
    const response = await hf.chatCompletion({
      model: GENERATION_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
      top_p: 0.9
    });

    rawText = response.choices[0]?.message?.content;
    if (!rawText) throw new Error('No text generated from LLM');
  } catch (error) {
    throw new Error(`HuggingFace generation error: ${error.message}`);
  }

  // Extract JSON from the response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: return a structured error response
    return buildFallbackResponse(symptoms, rawText);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return buildFallbackResponse(symptoms, rawText);
  }
}

function buildFallbackResponse(symptoms, rawText) {
  return {
    preliminary_suggestions: [
      `Based on your reported symptoms (${symptoms.join(', ')}), it's advisable to seek medical consultation.`,
      rawText?.slice(0, 300) || 'Unable to extract detailed suggestions at this time.'
    ],
    urgency_level: 'medium',
    urgency_explanation: 'Could not determine exact urgency. Please consult a doctor as a precaution.',
    doctor_recommendations: [
      { specialty: 'General Practitioner', reason: 'A GP can assess your symptoms and refer you appropriately.' }
    ],
    self_care_tips: ['Rest and stay hydrated', 'Monitor your symptoms and seek help if they worsen'],
    disclaimer: 'This is preliminary AI-generated guidance only. Please consult a qualified healthcare professional for actual diagnosis and treatment.'
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Full RAG pipeline: embed query → retrieve → generate.
 */
async function retrieveAndGenerate(symptoms) {
  const query = symptoms.join(', ');

  // 1. Embed the query
  const [queryEmbedding] = await getEmbeddings([query]);

  // 2. Retrieve relevant chunks from Atlas Vector Search
  let contextChunks = [];
  try {
    contextChunks = await retrieveRelevantChunks(queryEmbedding);
  } catch (err) {
    console.warn('[RAG] Vector search failed, proceeding without context:', err.message);
  }

  // 3. Generate response with LLM
  const result = await generateMedicalResponse(symptoms, contextChunks);

  return {
    ...result,
    retrieved_chunks: contextChunks.length,
    symptoms_analyzed: symptoms
  };
}

module.exports = { embedAndStore, retrieveAndGenerate };
