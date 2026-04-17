'use strict';

const { retrieveAndGenerate } = require('../services/ragService');

/**
 * POST /api/ai/symptom-check
 * Body: { symptoms: string[] }
 * Returns: { preliminary_suggestions, urgency_level, urgency_explanation,
 *             doctor_recommendations, self_care_tips, disclaimer }
 */
const checkSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        message: 'Please provide an array of symptoms.'
      });
    }

    if (symptoms.length > 20) {
      return res.status(400).json({
        message: 'Please select a maximum of 20 symptoms.'
      });
    }

    const cleanedSymptoms = symptoms
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0 && s.length < 200);

    if (cleanedSymptoms.length === 0) {
      return res.status(400).json({ message: 'No valid symptoms provided.' });
    }

    console.log(`[AI Service] Symptom check for: ${cleanedSymptoms.join(', ')}`);

    const result = await retrieveAndGenerate(cleanedSymptoms);

    res.json({
      success: true,
      data: result,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[symptomController] Error:', error.message);

    // Handle HuggingFace model loading (cold start)
    if (error.message?.includes('loading') || error.message?.includes('503')) {
      return res.status(503).json({
        message: 'AI model is warming up. Please wait 30 seconds and try again.',
        retryAfter: 30
      });
    }

    res.status(500).json({
      message: 'Failed to analyze symptoms. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { checkSymptoms };
