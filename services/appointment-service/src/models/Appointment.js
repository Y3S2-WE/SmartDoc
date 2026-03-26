const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: { type: Number, min: 1, index: true },
    patientAuthUserId: { type: String, required: true, index: true },
    doctorAuthUserId: { type: String, required: true, index: true },
    doctorName: { type: String, trim: true, required: true },
    specialization: { type: String, trim: true, default: '' },
    hospitalOrClinicName: { type: String, trim: true, default: '' },
    doctorProfilePhoto: { type: String, trim: true, default: '' },
    channellingFee: { type: Number, min: 0, default: 0 },

    appointmentType: { type: String, enum: ['video', 'physical'], required: true },
    appointmentDate: { type: String, required: true, trim: true },
    appointmentTimeSlot: { type: String, required: true, trim: true },

    patientName: { type: String, trim: true, required: true },
    patientEmail: { type: String, trim: true, lowercase: true, required: true },
    patientPhoneNumber: { type: String, trim: true, required: true },
    patientAddress: { type: String, trim: true, default: '' },

    status: {
      type: String,
      enum: ['booked', 'confirmed', 'completed', 'cancelled'],
      default: 'booked'
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorAuthUserId: 1, appointmentDate: 1, appointmentTimeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['booked', 'confirmed'] } } }
);

appointmentSchema.index({ appointmentNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
