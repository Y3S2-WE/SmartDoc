require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3002;

const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || 'Patient Service'} is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start patient service:', error.message);
    process.exit(1);
  }
};

start();
