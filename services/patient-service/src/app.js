const path = require('path');
const express = require('express');
const cors = require('cors');

const patientRoutes = require('./routes/patientRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Patient Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Patient Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      patientBase: '/api/patients'
    }
  });
});

app.use('/api/patients', patientRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
