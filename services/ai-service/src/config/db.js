const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in environment');
    await mongoose.connect(uri);
    console.log('[AI Service] MongoDB Atlas connected');
  } catch (error) {
    console.error('[AI Service] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
