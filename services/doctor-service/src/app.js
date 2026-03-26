const express = require('express');
const cors = require('cors');

const doctorRoutes = require('./routes/doctorRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Doctor Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Doctor Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      doctorBase: '/api/doctors'
    }
  });
});

app.use('/api/doctors', doctorRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
