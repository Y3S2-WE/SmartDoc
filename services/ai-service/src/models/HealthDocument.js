const mongoose = require('mongoose');

const HealthDocumentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    uploadedBy: { type: String, required: true }, // admin user id
    uploadedByName: { type: String, default: 'Admin' },
    filePath: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing'
    },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthDocument', HealthDocumentSchema);
