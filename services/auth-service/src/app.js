const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Auth Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Auth Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      authBase: '/api/auth'
    }
  });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
