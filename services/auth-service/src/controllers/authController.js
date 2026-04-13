const { validationResult } = require('express-validator');
const axios = require('axios');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../config/constants');

const seedPatientProfile = async (user, profileData) => {
  const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002/api/patients';
  const token = generateToken({ userId: user._id, role: user.role });

  try {
    await axios.put(`${patientServiceUrl}/me/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.warn('Patient profile sync failed:', err.response?.data?.message || err.message);
  }
};

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

    await seedPatientProfile(user, {
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      gender: gender ? String(gender).toLowerCase() : '',
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
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ count: users.length, users });
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
  listApprovedDoctors,
  verifyDoctor
};
