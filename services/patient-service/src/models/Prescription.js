const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patientAuthUserId: { type: String, required: true, index: true },
    doctorAuthUserId: { type: String, required: true },
    doctorName: { type: String, trim: true, default: 'Doctor' },
    diagnosis: { type: String, trim: true, default: '' },
    medications: [{ type: String, trim: true }],
    dosageInstructions: { type: String, trim: true, default: '' },
    testsRecommended: [{ type: String, trim: true }],
    followUpDate: { type: Date, default: null },
    templateName: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
