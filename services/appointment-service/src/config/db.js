const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required for Appointment Service');
  }

  const options = {};
  if (process.env.MONGODB_DB_NAME) {
    options.dbName = process.env.MONGODB_DB_NAME;
  }

  await mongoose.connect(mongoUri, options);
  console.log('Appointment Service connected to MongoDB');
};

module.exports = connectDB;
