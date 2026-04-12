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

const allowedGenderValues = ['male', 'female', 'other'];
const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emailRule = body('email').isEmail().withMessage('Valid email is required').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');
const phoneRule = body('phoneNumber')
  .notEmpty()
  .withMessage('Phone number is required')
  .custom((value) => String(value || '').replace(/\D/g, '').length === 10)
  .withMessage('Phone number must be exactly 10 digits');
const fullNameRule = body('fullName')
  .trim()
  .notEmpty()
  .withMessage('Full name is required')
  .isLength({ min: 3 })
  .withMessage('Full name must be at least 3 characters long')
  .custom((value) => !/\d/.test(String(value || '')))
  .withMessage('Full name cannot contain numbers');

const nationalIdRule = body('nationalId')
  .optional({ values: 'falsy' })
  .custom((value) => /^(\d{9}[VvXx]|\d{12})$/.test(String(value || '').trim()))
  .withMessage('NIC must be 12 digits or 9 digits followed by V/X');

const confirmPasswordRule = body('confirmPassword')
  .notEmpty()
  .withMessage('Confirm password is required')
  .custom((value, { req }) => value === req.body.password)
  .withMessage('Password and confirm password must match');

const dateOfBirthRule = body('dateOfBirth')
  .notEmpty()
  .withMessage('Date of birth is required')
  .isISO8601()
  .withMessage('Date of birth must be a valid date')
  .custom((value) => {
    const inputDate = new Date(value);
    return !Number.isNaN(inputDate.getTime()) && inputDate <= new Date();
  })
  .withMessage('Date of birth must be in the past');

const genderRule = body('gender')
  .notEmpty()
  .withMessage('Gender is required')
  .isIn(allowedGenderValues)
  .withMessage('Gender must be male, female, or other');

const bloodGroupRule = body('bloodGroup')
  .notEmpty()
  .withMessage('Blood group is required')
  .isIn(allowedBloodGroups)
  .withMessage('Blood group is invalid');

router.post(
  '/register/patient',
  [
    fullNameRule,
    emailRule,
    passwordRule,
    confirmPasswordRule,
    phoneRule,
    dateOfBirthRule,
    genderRule,
    bloodGroupRule,
    nationalIdRule
  ],
  registerPatient
);

router.post(
  '/register/doctor',
  [
    fullNameRule,
    emailRule,
    passwordRule,
    confirmPasswordRule,
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
