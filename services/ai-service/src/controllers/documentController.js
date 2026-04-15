'use strict';

const path = require('path');
const multer = require('multer');
const HealthDocument = require('../models/HealthDocument');
const DocumentChunk = require('../models/DocumentChunk');
const { embedAndStore } = require('../services/ragService');

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB
}).single('document');

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/ai/documents
 * Upload a health guidance document (admin only).
 * Triggers asynchronous embedding pipeline.
 */
const uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileType = ext === 'pdf' ? 'pdf' : 'docx';

    try {
      const doc = await HealthDocument.create({
        originalName: req.file.originalname,
        fileType,
        uploadedBy: req.user.userId || req.user.id || req.user._id || 'Unknown',
        uploadedByName: req.user.fullName || 'Admin',
        filePath: req.file.path,
        status: 'processing'
      });

      res.status(202).json({
        message: 'Document uploaded. Embedding in progress...',
        documentId: doc._id,
        originalName: doc.originalName,
        status: doc.status
      });

      // Run embedding asynchronously (do not block the HTTP response)
      setImmediate(async () => {
        try {
          const chunkCount = await embedAndStore(req.file.path, fileType, doc._id);
          await HealthDocument.findByIdAndUpdate(doc._id, {
            status: 'ready',
            chunkCount
          });
          console.log(`[AI Service] Document "${doc.originalName}" embedded (${chunkCount} chunks)`);
        } catch (embedErr) {
          console.error('[AI Service] Embedding failed:', embedErr.message);
          await HealthDocument.findByIdAndUpdate(doc._id, {
            status: 'failed',
            errorMessage: embedErr.message
          });
        }
      });
    } catch (error) {
      console.error('[documentController] Upload error:', error);
      res.status(500).json({ message: 'Failed to process document upload.' });
    }
  });
};

/**
 * GET /api/ai/documents
 * List all uploaded health documents (admin only).
 */
const listDocuments = async (_req, res) => {
  try {
    const docs = await HealthDocument.find().sort({ createdAt: -1 }).lean();
    res.json({ documents: docs });
  } catch (error) {
    console.error('[documentController] List error:', error);
    res.status(500).json({ message: 'Failed to fetch documents.' });
  }
};

/**
 * DELETE /api/ai/documents/:id
 * Delete a document and all its chunks (admin only).
 */
const deleteDocument = async (req, res) => {
  try {
    const doc = await HealthDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    await DocumentChunk.deleteMany({ documentId: doc._id });
    await doc.deleteOne();

    // Clean up uploaded file
    const fs = require('fs');
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[documentController] Delete error:', error);
    res.status(500).json({ message: 'Failed to delete document.' });
  }
};

module.exports = { uploadDocument, listDocuments, deleteDocument };
