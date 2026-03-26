const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    authUserId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    nationalId: { type: String, trim: true, default: '' },
    profilePhoto: { type: String, trim: true, default: '' },
    bloodGroup: { type: String, trim: true, default: '' },
    knownAllergies: [{ type: String, trim: true }],
    medicalConditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    emergencyContactName: { type: String, trim: true, default: '' },
    emergencyContactPhone: { type: String, trim: true, default: '' },
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
