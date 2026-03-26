const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patientAuthUserId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
