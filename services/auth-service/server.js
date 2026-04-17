require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedAdmin = require('./src/utils/seedAdmin');

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await connectDB();
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || 'Auth Service'} is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start auth service:', error.message);
    process.exit(1);
  }
};

start();
