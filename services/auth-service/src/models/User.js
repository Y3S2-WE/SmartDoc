const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const patientProfileSchema = new mongoose.Schema(
  {
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    nationalId: { type: String, trim: true },
    profilePhoto: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    knownAllergies: [{ type: String, trim: true }],
    medicalConditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    addressLine: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    profilePhoto: { type: String, trim: true },
    medicalLicenseNumber: { type: String, trim: true },
    specialization: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0 },
    qualifications: [{ type: String, trim: true }],
    hospitalOrClinicName: { type: String, trim: true },
    consultationFee: { type: Number, min: 0 },
    clinicAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phoneNumber: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN],
      required: true
    },
    patientProfile: patientProfileSchema,
    doctorProfile: doctorProfileSchema,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', async function passwordHashHook(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
