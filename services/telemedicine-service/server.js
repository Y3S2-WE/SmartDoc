require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Telemedicine Service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Telemedicine Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createSession: '/api/telemedicine/sessions'
    }
  });
});

const createRoomName = ({ appointmentNumber, appointmentDate, appointmentTimeSlot, patientAuthUserId, doctorAuthUserId }) => {
  const seed = `${appointmentNumber}|${appointmentDate}|${appointmentTimeSlot}|${patientAuthUserId}|${doctorAuthUserId}`;
  const digest = crypto
    .createHmac('sha256', process.env.TELEMEDICINE_ROOM_SECRET || process.env.JWT_SECRET || 'smartdoc-room-secret')
    .update(seed)
    .digest('hex')
    .slice(0, 14);

  return `smartdoc-${appointmentNumber}-${digest}`;
};

app.post('/api/telemedicine/sessions', (req, res) => {
  const {
    appointmentNumber,
    appointmentDate,
    appointmentTimeSlot,
    patientAuthUserId,
    doctorAuthUserId
  } = req.body;

  if (!appointmentNumber || !appointmentDate || !appointmentTimeSlot || !patientAuthUserId || !doctorAuthUserId) {
    return res.status(400).json({ message: 'Missing session payload fields' });
  }

  const roomName = createRoomName({
    appointmentNumber,
    appointmentDate,
    appointmentTimeSlot,
    patientAuthUserId,
    doctorAuthUserId
  });

  const jitsiBaseUrl = (process.env.JITSI_BASE_URL || 'https://meet.jit.si').replace(/\/$/, '');
  const roomLink = `${jitsiBaseUrl}/${roomName}`;

  return res.status(201).json({
    provider: 'jitsi-meet',
    roomName,
    roomLink
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${process.env.SERVICE_NAME || 'Telemedicine Service'} is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
