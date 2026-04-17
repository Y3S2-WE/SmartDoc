const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthDocument',
      required: true
    },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      filename: String,
      chunkSize: Number
    }
  },
  { timestamps: true }
);

// Index for efficient document chunk lookups
DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', DocumentChunkSchema);
