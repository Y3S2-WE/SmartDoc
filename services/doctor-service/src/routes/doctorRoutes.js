const express = require('express');

const {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateMyAvailability,
  issueDigitalPrescription,
  listPatientUploadedReports,
  getPublicDoctorProfile
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public/:authUserId/profile', getPublicDoctorProfile);

router.get('/me/profile', protect, authorize('doctor'), getMyDoctorProfile);
router.put('/me/profile', protect, authorize('doctor'), updateMyDoctorProfile);
router.put('/me/availability', protect, authorize('doctor'), updateMyAvailability);

router.post('/me/prescriptions', protect, authorize('doctor'), issueDigitalPrescription);
router.get('/patient-reports', protect, authorize('doctor', 'admin'), listPatientUploadedReports);

module.exports = router;
