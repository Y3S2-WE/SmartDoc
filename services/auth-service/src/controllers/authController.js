const { validationResult } = require('express-validator');
const http = require('http');
const https = require('https');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../config/constants');

const parseStringList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join(', ');

    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

const toSafeUser = (userDoc) => ({
  id: userDoc._id,
  fullName: userDoc.fullName,
  email: userDoc.email,
  phoneNumber: userDoc.phoneNumber,
  role: userDoc.role,
  patientProfile: userDoc.patientProfile,
  doctorProfile: userDoc.doctorProfile,
  isActive: userDoc.isActive,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt
});

const fetchJsonFromUrl = (targetUrl, headers = {}) =>
  new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const request = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...headers
        }
      },
      (response) => {
        let rawData = '';

        response.on('data', (chunk) => {
          rawData += chunk;
        });

        response.on('end', () => {
          let payload = {};

          if (rawData) {
            try {
              payload = JSON.parse(rawData);
            } catch (error) {
              payload = { raw: rawData };
            }
          }

          if (response.statusCode >= 200 && response.statusCode < 300) {
            return resolve(payload);
          }

          const fetchError = new Error(payload.message || `Upstream request failed with status ${response.statusCode}`);
          fetchError.statusCode = response.statusCode;
          fetchError.payload = payload;
          return reject(fetchError);
        });
      }
    );

    request.setTimeout(6000, () => {
      request.destroy(new Error('Upstream request timeout'));
    });

    request.on('error', reject);
    request.end();
  });

const buildAuthResponse = (userDoc) => {
  const token = generateToken({ userId: userDoc._id, role: userDoc.role });

  return {
    token,
    user: {
      id: userDoc._id,
      fullName: userDoc.fullName,
      email: userDoc.email,
      phoneNumber: userDoc.phoneNumber,
      role: userDoc.role,
      patientProfile: userDoc.patientProfile,
      doctorProfile: userDoc.doctorProfile,
      isActive: userDoc.isActive
    }
  };
};

const registerPatient = async (req, res, next) => {
  try {
    checkValidation(req);

    const {
      fullName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      dateOfBirth,
      gender,
      nationalId,
      profilePhoto,
      bloodGroup,
      knownAllergies,
      medicalConditions,
      currentMedications,
      emergencyContactName,
      emergencyContactPhone,
      addressLine,
      city,
      district,
      postalCode
    } = req.body;

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error('Password and confirm password must match');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      role: ROLES.PATIENT,
      patientProfile: {
        dateOfBirth,
        gender: gender ? String(gender).toLowerCase() : undefined,
        nationalId,
        profilePhoto,
        bloodGroup,
        knownAllergies: parseStringList(knownAllergies),
        medicalConditions: parseStringList(medicalConditions),
        currentMedications: parseStringList(currentMedications),
        emergencyContactName,
        emergencyContactPhone,
        addressLine,
        city,
        district,
        postalCode
      }
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

const registerDoctor = async (req, res, next) => {
  try {
    checkValidation(req);

    const {
      fullName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      profilePhoto,
      medicalLicenseNumber,
      specialization,
      yearsOfExperience,
      qualifications,
      hospitalOrClinicName,
      consultationFee,
      clinicAddress,
      city,
      district
    } = req.body;

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error('Password and confirm password must match');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      role: ROLES.DOCTOR,
      doctorProfile: {
        profilePhoto,
        medicalLicenseNumber,
        specialization,
        yearsOfExperience,
        qualifications: parseStringList(qualifications),
        hospitalOrClinicName,
        consultationFee,
        clinicAddress,
        city,
        district,
        isVerified: false,
        verificationStatus: 'pending'
      }
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    checkValidation(req);

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.role) {
      filters.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      const pattern = String(req.query.search).trim();
      if (pattern) {
        filters.$or = [
          { fullName: { $regex: pattern, $options: 'i' } },
          { email: { $regex: pattern, $options: 'i' } },
          { phoneNumber: { $regex: pattern, $options: 'i' } }
        ];
      }
    }

    const users = await User.find(filters).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    next(error);
  }
};

const updateUserAccountStatus = async (req, res, next) => {
  try {
    checkValidation(req);

    const { isActive } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (String(user._id) === String(req.user._id) && isActive === false) {
      res.status(400);
      throw new Error('Admin cannot deactivate the currently logged-in account');
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: isActive ? 'User account activated successfully' : 'User account deactivated successfully',
      user: toSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    checkValidation(req);

    const { role } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (String(user._id) === String(req.user._id) && role !== ROLES.ADMIN) {
      res.status(400);
      throw new Error('Admin cannot change own role to non-admin');
    }

    user.role = role;

    if (role === ROLES.DOCTOR && !user.doctorProfile) {
      user.doctorProfile = {
        isVerified: false,
        verificationStatus: 'pending'
      };
    }

    await user.save();

    res.status(200).json({
      message: 'User role updated successfully',
      user: toSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const removeUserAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (String(user._id) === String(req.user._id)) {
      res.status(400);
      throw new Error('Admin cannot delete the currently logged-in account');
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      message: 'User account removed successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPlatformOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      patientUsers,
      doctorUsers,
      adminUsers,
      pendingDoctorVerifications,
      approvedDoctorVerifications,
      rejectedDoctorVerifications,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: ROLES.PATIENT }),
      User.countDocuments({ role: ROLES.DOCTOR }),
      User.countDocuments({ role: ROLES.ADMIN }),
      User.countDocuments({ role: ROLES.DOCTOR, 'doctorProfile.verificationStatus': 'pending' }),
      User.countDocuments({ role: ROLES.DOCTOR, 'doctorProfile.verificationStatus': 'approved' }),
      User.countDocuments({ role: ROLES.DOCTOR, 'doctorProfile.verificationStatus': 'rejected' }),
      User.find({}).select('-password').sort({ createdAt: -1 }).limit(5)
    ]);

    res.status(200).json({
      overview: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: {
            patient: patientUsers,
            doctor: doctorUsers,
            admin: adminUsers
          }
        },
        doctorVerification: {
          pending: pendingDoctorVerifications,
          approved: approvedDoctorVerifications,
          rejected: rejectedDoctorVerifications
        }
      },
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};

const getAdminFinancialTransactions = async (req, res, next) => {
  try {
    const paymentServiceBaseUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
    const endpoint = process.env.PAYMENT_SERVICE_ADMIN_TRANSACTIONS_URL || `${paymentServiceBaseUrl}/api/payments/admin/transactions`;

    try {
      const payload = await fetchJsonFromUrl(endpoint, {
        Authorization: req.headers.authorization || ''
      });

      return res.status(200).json({
        available: true,
        source: endpoint,
        ...payload
      });
    } catch (upstreamError) {
      return res.status(200).json({
        available: false,
        source: endpoint,
        message:
          upstreamError.statusCode === 404
            ? 'Payment service transaction endpoint is not implemented yet'
            : 'Unable to fetch financial transactions from payment service',
        upstreamStatus: upstreamError.statusCode || 500
      });
    }
  } catch (error) {
    next(error);
  }
};

const listApprovedDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({
      role: ROLES.DOCTOR,
      isActive: true,
      $or: [{ 'doctorProfile.isVerified': true }, { 'doctorProfile.verificationStatus': 'approved' }]
    })
      .select('-password')
      .sort({ fullName: 1 });

    res.status(200).json({ count: doctors.length, doctors });
  } catch (error) {
    next(error);
  }
};

const verifyDoctor = async (req, res, next) => {
  try {
    const approved = req.body?.approved !== false;

    const doctor = await User.findById(req.params.userId);

    if (!doctor || doctor.role !== ROLES.DOCTOR) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    if (!doctor.doctorProfile) {
      doctor.doctorProfile = {};
    }

    doctor.doctorProfile.isVerified = approved;
    doctor.doctorProfile.verificationStatus = approved ? 'approved' : 'rejected';

    await doctor.save();

    res.status(200).json({
      message: approved ? 'Doctor approved successfully' : 'Doctor rejected successfully',
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        doctorProfile: doctor.doctorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
