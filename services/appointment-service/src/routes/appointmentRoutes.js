const express = require('express');

const {
  bookAppointment,
  listMyPatientAppointments,
  listMyDoctorAppointments,
  cancelMyPatientAppointment,
  updateAppointmentStatusByDoctor
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/book', protect, authorize('patient'), bookAppointment);
router.get('/me/patient', protect, authorize('patient'), listMyPatientAppointments);
router.patch('/me/patient/:appointmentId/cancel', protect, authorize('patient'), cancelMyPatientAppointment);
router.get('/me/doctor', protect, authorize('doctor'), listMyDoctorAppointments);
router.patch('/me/doctor/:appointmentId/status', protect, authorize('doctor'), updateAppointmentStatusByDoctor);

module.exports = router;
