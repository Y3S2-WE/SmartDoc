const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    authUserId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    profilePhoto: { type: String, trim: true, default: '' },
    medicalLicenseNumber: { type: String, trim: true, default: '' },
    specialization: { type: String, trim: true, default: '' },
    yearsOfExperience: { type: Number, min: 0, default: 0 },
    qualifications: [{ type: String, trim: true }],
    hospitalOrClinicName: { type: String, trim: true, default: '' },
    consultationFee: { type: Number, min: 0, default: 0 },
    clinicAddress: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    availabilityNotes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
