const express = require('express');

const {
  getMyProfile,
  updateMyProfile,
  uploadMedicalReport,
  listMedicalReports,
  listPatientReportsForDoctor,
  deleteReportByDoctor,
  listMyPrescriptions,
  issuePrescription
} = require('../controllers/patientController');
const upload = require('../utils/uploadConfig');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me/profile', protect, authorize('patient'), getMyProfile);
router.put('/me/profile', protect, authorize('patient'), updateMyProfile);

router.post('/me/reports', protect, authorize('patient'), upload.single('file'), uploadMedicalReport);
router.get('/me/reports', protect, authorize('patient'), listMedicalReports);
router.get('/reports', protect, authorize('doctor', 'admin'), listPatientReportsForDoctor);
router.delete('/reports/:reportId', protect, authorize('doctor', 'admin'), deleteReportByDoctor);

router.get('/me/prescriptions', protect, authorize('patient'), listMyPrescriptions);

router.post('/prescriptions/issue', protect, authorize('doctor', 'admin'), issuePrescription);

module.exports = router;
