const express = require('express');
const { body } = require('express-validator');

const {
  registerPatient,
  registerDoctor,
  login,
  getCurrentUser,
  listUsers,
  updateUserAccountStatus,
  updateUserRole,
  removeUserAccount,
  getAdminPlatformOverview,
  getAdminFinancialTransactions,
  listApprovedDoctors,
  verifyDoctor
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

const emailRule = body('email').isEmail().withMessage('Valid email is required').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');
const phoneRule = body('phoneNumber').notEmpty().withMessage('Phone number is required');
const fullNameRule = body('fullName').notEmpty().withMessage('Full name is required');

router.post(
  '/register/patient',
  [
    fullNameRule,
    emailRule,
    passwordRule,
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    phoneRule
  ],
  registerPatient
);

router.post(
  '/register/doctor',
  [
    fullNameRule,
    emailRule,
    passwordRule,
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    phoneRule,
    body('medicalLicenseNumber').notEmpty().withMessage('Medical license number is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('yearsOfExperience')
      .optional({ values: 'falsy' })
      .isInt({ min: 0 })
      .withMessage('Years of experience must be a non-negative number'),
    body('consultationFee')
      .optional({ values: 'falsy' })
      .isFloat({ min: 0 })
      .withMessage('Consultation fee must be a non-negative number')
  ],
  registerDoctor
);

router.post('/login', [emailRule, passwordRule], login);

router.get('/me', protect, getCurrentUser);

router.get('/doctors/approved', listApprovedDoctors);

router.get('/admin/overview', protect, authorize(ROLES.ADMIN), getAdminPlatformOverview);

router.get('/admin/financial-transactions', protect, authorize(ROLES.ADMIN), getAdminFinancialTransactions);

router.get('/admin/users', protect, authorize(ROLES.ADMIN), listUsers);

router.patch(
  '/admin/users/:userId/status',
  protect,
  authorize(ROLES.ADMIN),
  [body('isActive').isBoolean().withMessage('isActive must be boolean')],
  updateUserAccountStatus
);

router.patch(
  '/admin/users/:userId/role',
  protect,
  authorize(ROLES.ADMIN),
  [body('role').isIn(Object.values(ROLES)).withMessage('Valid role is required')],
  updateUserRole
);

router.delete('/admin/users/:userId', protect, authorize(ROLES.ADMIN), removeUserAccount);

router.patch('/admin/doctors/:userId/verify', protect, authorize(ROLES.ADMIN), verifyDoctor);

module.exports = router;
