require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || process.env.SMTP_USER || 'smartdoc360@gmail.com';
const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER || '';

const mailTransporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const normalizePhoneNumber = (phone) => {
  if (!phone) {
    return '';
  }

  const cleaned = String(phone).replace(/[\s()-]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Default local fallback: Sri Lanka local numbers 0XXXXXXXXX -> +94XXXXXXXXX
  if (cleaned.startsWith('0')) {
    return `+94${cleaned.slice(1)}`;
  }

  return cleaned.startsWith('94') ? `+${cleaned}` : `+${cleaned}`;
};

const baseStyles = `
  <div style="font-family: Arial, sans-serif; color: #123; line-height: 1.6;">
    <h2 style="margin: 0 0 12px; color: #0b5f66;">SmartDoc Appointment Update</h2>
`;

const tableRow = (label, value) => `
  <tr>
    <td style="padding: 6px 10px; border: 1px solid #d9e5e7; background: #f7fbfb; font-weight: 600; width: 220px;">${label}</td>
    <td style="padding: 6px 10px; border: 1px solid #d9e5e7;">${value || '-'}</td>
  </tr>
`;

const renderAppointmentDetailsTable = (appointment) => `
  <table style="border-collapse: collapse; margin: 12px 0; width: 100%; max-width: 680px;">
    ${tableRow('Appointment Number', appointment.appointmentNumber)}
    ${tableRow('Status', appointment.status)}
    ${tableRow('Doctor Name', appointment.doctorName)}
    ${tableRow('Specialization', appointment.specialization)}
    ${tableRow('Hospital / Clinic', appointment.hospitalOrClinicName)}
    ${tableRow('Appointment Type', appointment.appointmentType)}
    ${tableRow('Appointment Date', appointment.appointmentDate)}
    ${tableRow('Appointment Time', appointment.appointmentTimeSlot)}
    ${tableRow('Patient Name', appointment.patientName)}
    ${tableRow('Patient Email', appointment.patientEmail)}
    ${tableRow('Patient Phone', appointment.patientPhoneNumber)}
    ${tableRow('Channelling Fee (LKR)', appointment.channellingFee)}
    ${appointment.videoRoomLink ? tableRow('Video Room Link', `<a href="${appointment.videoRoomLink}">${appointment.videoRoomLink}</a>`) : ''}
  </table>
`;

const buildBookedTemplates = (appointment) => {
  const patientSubject = `Appointment Confirmed | #${appointment.appointmentNumber} | SmartDoc`;
  const doctorSubject = `New Appointment Booked | #${appointment.appointmentNumber} | SmartDoc`;

  const patientHtml = `${baseStyles}
    <p>Dear ${appointment.patientName || 'Patient'},</p>
    <p>Your appointment has been booked successfully. Please find your appointment details below.</p>
    ${renderAppointmentDetailsTable(appointment)}
    <p>Thank you for choosing SmartDoc.</p>
    <p>Regards,<br/>SmartDoc Care Team</p>
  </div>`;

  const doctorHtml = `${baseStyles}
    <p>Dear Dr. ${appointment.doctorName || 'Doctor'},</p>
    <p>A new appointment has been booked with you. Please review the details below.</p>
    ${renderAppointmentDetailsTable(appointment)}
    <p>Regards,<br/>SmartDoc Care Team</p>
  </div>`;

  return {
    patient: { subject: patientSubject, html: patientHtml },
    doctor: { subject: doctorSubject, html: doctorHtml }
  };
};

const buildBookedSmsMessages = (appointment) => {
  const patientSms =
    `SmartDoc: Appointment #${appointment.appointmentNumber} confirmed. ` +
    `Dr. ${appointment.doctorName}, ${appointment.appointmentDate} at ${appointment.appointmentTimeSlot}, ` +
    `${appointment.hospitalOrClinicName || 'Clinic'}. Status: ${appointment.status}.`;

  const doctorSms =
    `SmartDoc: New booking #${appointment.appointmentNumber}. ` +
    `Patient: ${appointment.patientName}, ${appointment.appointmentDate} at ${appointment.appointmentTimeSlot}, ` +
    `${appointment.appointmentType} consultation. ${appointment.hospitalOrClinicName || 'Clinic'}.`;

  return { patientSms, doctorSms };
};

const buildCancelledTemplates = (appointment) => {
  const patientSubject = `Appointment Cancelled | #${appointment.appointmentNumber} | SmartDoc`;
  const doctorSubject = `Appointment Cancelled by Patient | #${appointment.appointmentNumber} | SmartDoc`;

  const patientHtml = `${baseStyles}
    <p>Dear ${appointment.patientName || 'Patient'},</p>
    <p>Your appointment has been cancelled successfully. Please find the cancelled appointment details below.</p>
    ${renderAppointmentDetailsTable(appointment)}
    <p>If needed, you can book a new appointment anytime through SmartDoc.</p>
    <p>Regards,<br/>SmartDoc Care Team</p>
  </div>`;

  const doctorHtml = `${baseStyles}
    <p>Dear Dr. ${appointment.doctorName || 'Doctor'},</p>
    <p>The following appointment has been cancelled by the patient.</p>
    ${renderAppointmentDetailsTable(appointment)}
    <p>Regards,<br/>SmartDoc Care Team</p>
  </div>`;

  return {
    patient: { subject: patientSubject, html: patientHtml },
    doctor: { subject: doctorSubject, html: doctorHtml }
  };
};

const buildCancelledSmsMessages = (appointment) => {
  const patientSms =
    `SmartDoc: Appointment #${appointment.appointmentNumber} has been cancelled. ` +
    `Dr. ${appointment.doctorName}, ${appointment.appointmentDate} at ${appointment.appointmentTimeSlot}.`;

  const doctorSms =
    `SmartDoc: Appointment #${appointment.appointmentNumber} was cancelled by patient ${appointment.patientName}. ` +
    `${appointment.appointmentDate} at ${appointment.appointmentTimeSlot}.`;

  return { patientSms, doctorSms };
};

const sendAppointmentEmails = async ({ appointment, type }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured for notification service');
  }

  if (!appointment || !appointment.patientEmail) {
    throw new Error('Appointment and patient email are required to send notifications');
  }

  const templates = type === 'cancelled' ? buildCancelledTemplates(appointment) : buildBookedTemplates(appointment);
  const tasks = [];

  tasks.push(
    mailTransporter.sendMail({
      from: fromEmail,
      to: appointment.patientEmail,
      subject: templates.patient.subject,
      html: templates.patient.html
    })
  );

  if (appointment.doctorEmail) {
    tasks.push(
      mailTransporter.sendMail({
        from: fromEmail,
        to: appointment.doctorEmail,
        subject: templates.doctor.subject,
        html: templates.doctor.html
      })
    );
  }

  await Promise.all(tasks);
};

const sendAppointmentSms = async ({ appointment, type }) => {
  if (!twilioClient || !twilioFromNumber) {
    throw new Error('Twilio credentials are not configured for notification service');
  }

  if (!appointment || !appointment.patientPhoneNumber) {
    throw new Error('Appointment and patient phone number are required to send SMS notifications');
  }

  const messages = type === 'cancelled' ? buildCancelledSmsMessages(appointment) : buildBookedSmsMessages(appointment);
  const tasks = [];

  tasks.push(
    twilioClient.messages.create({
      body: messages.patientSms,
      from: twilioFromNumber,
      to: normalizePhoneNumber(appointment.patientPhoneNumber)
    })
  );

  if (appointment.doctorPhoneNumber) {
    tasks.push(
      twilioClient.messages.create({
        body: messages.doctorSms,
        from: twilioFromNumber,
        to: normalizePhoneNumber(appointment.doctorPhoneNumber)
      })
    );
  }

  await Promise.all(tasks);
};

app.post('/api/notifications/appointment/booked', async (req, res) => {
  try {
    const { appointment } = req.body;
    await sendAppointmentEmails({ appointment, type: 'booked' });
    await sendAppointmentSms({ appointment, type: 'booked' });

    return res.status(200).json({ message: 'Appointment booking email and SMS notifications sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to send booking notifications' });
  }
});

app.post('/api/notifications/appointment/cancelled', async (req, res) => {
  try {
    const { appointment } = req.body;
    await sendAppointmentEmails({ appointment, type: 'cancelled' });
    await sendAppointmentSms({ appointment, type: 'cancelled' });

    return res.status(200).json({ message: 'Appointment cancellation email and SMS notifications sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to send cancellation notifications' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Notification Service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Notification Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      appointmentBooked: '/api/notifications/appointment/booked',
      appointmentCancelled: '/api/notifications/appointment/cancelled'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${process.env.SERVICE_NAME || 'Notification Service'} is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
