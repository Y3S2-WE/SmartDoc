require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3003;

const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || 'Doctor Service'} is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start doctor service:', error.message);
    process.exit(1);
  }
};

start();
