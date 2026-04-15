require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3006;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[AI Service] Running on port ${PORT}`);
  });
});
