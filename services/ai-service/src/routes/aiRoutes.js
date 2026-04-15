const express = require('express');
const router = express.Router();

const { protect, adminOnly, patientOrAdmin } = require('../middleware/authMiddleware');
const { uploadDocument, listDocuments, deleteDocument } = require('../controllers/documentController');
const { checkSymptoms } = require('../controllers/symptomController');

// ── Document Routes (Admin only) ──────────────────────────────────────────────
router.post('/documents', protect, adminOnly, uploadDocument);
router.get('/documents', protect, adminOnly, listDocuments);
router.delete('/documents/:id', protect, adminOnly, deleteDocument);

// ── Symptom Check Route (Patient or Admin) ─────────────────────────────────
router.post('/symptom-check', protect, patientOrAdmin, checkSymptoms);

module.exports = router;
