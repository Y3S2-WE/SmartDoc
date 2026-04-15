const axios = require('axios');

const DoctorProfile = require('../models/DoctorProfile');

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

const toNumber = (value, fallback = 0) => {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : fallback;
};

const parseAvailabilitySchedule = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const date = String(entry?.date || '').trim();

      const timeSlots = Array.isArray(entry?.timeSlots)
        ? entry.timeSlots.map((slot) => String(slot).trim()).filter(Boolean)
        : String(entry?.timeSlots || '')
            .split(',')
            .map((slot) => slot.trim())
            .filter(Boolean);

      return {
        date,
        timeSlots: [...new Set(timeSlots)]
      };
    })
    .filter((entry) => entry.date && entry.timeSlots.length > 0);
};

const getMyDoctorProfile = async (req, res, next) => {
  try {
    const authUserId = req.user.userId;
    let profile = await DoctorProfile.findOne({ authUserId });

    if (!profile) {
      profile = await DoctorProfile.create({ authUserId });
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

const updateMyDoctorProfile = async (req, res, next) => {
  try {
    const authUserId = req.user.userId;

    const updated = await DoctorProfile.findOneAndUpdate(
      { authUserId },
      {
        $set: {
          authUserId,
          fullName: req.body.fullName ?? '',
          email: req.body.email ?? '',
          phoneNumber: req.body.phoneNumber ?? '',
          profilePhoto: req.body.profilePhoto ?? '',
          medicalLicenseNumber: req.body.medicalLicenseNumber ?? '',
          specialization: req.body.specialization ?? '',
          yearsOfExperience: toNumber(req.body.yearsOfExperience, 0),
          qualifications: parseStringList(req.body.qualifications),
          hospitalOrClinicName: req.body.hospitalOrClinicName ?? '',
          consultationFee: toNumber(req.body.consultationFee, 0),
          clinicAddress: req.body.clinicAddress ?? '',
          city: req.body.city ?? '',
          district: req.body.district ?? '',
          bio: req.body.bio ?? '',
          availabilityNotes: req.body.availabilityNotes ?? '',
          availabilitySchedule: parseAvailabilitySchedule(req.body.availabilitySchedule)
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Doctor profile updated successfully', profile: updated });
  } catch (error) {
    next(error);
  }
};

const issueDigitalPrescription = async (req, res, next) => {
  try {
    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002/api/patients';

    const response = await axios.post(
      `${patientServiceUrl}/prescriptions/issue`,
      {
        patientAuthUserId: req.body.patientAuthUserId,
        doctorName: req.body.doctorName || req.body.fullName || 'Doctor',
        diagnosis: req.body.diagnosis,
        medications: req.body.medications,
        dosageInstructions: req.body.dosageInstructions,
        testsRecommended: req.body.testsRecommended,
        followUpDate: req.body.followUpDate,
        templateName: req.body.templateName,
        notes: req.body.notes
      },
      {
        headers: {
          Authorization: req.headers.authorization || ''
        }
      }
    );

    res.status(201).json(response.data);
  } catch (error) {
    const message = error.response?.data?.message || 'Unable to issue prescription';
    res.status(error.response?.status || 500);
    next(new Error(message));
  }
};

const updateMyAvailability = async (req, res, next) => {
  try {
    const authUserId = req.user.userId;
    const incoming = req.body.availabilitySchedule;

    if (!Array.isArray(incoming)) {
      res.status(400);
      throw new Error('availabilitySchedule must be an array.');
    }

    const schedule = incoming
      .map((entry) => {
        const date = String(entry?.date || '').trim();
        const timeSlots = Array.isArray(entry?.timeSlots)
          ? [...new Set(entry.timeSlots.map((s) => String(s).trim()).filter(Boolean))]
          : [];
        return { date, timeSlots };
      })
      .filter((entry) => entry.date);

    const updated = await DoctorProfile.findOneAndUpdate(
      { authUserId },
      { $set: { availabilitySchedule: schedule } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Availability saved successfully.',
      availabilitySchedule: updated.availabilitySchedule
    });
  } catch (error) {
    next(error);
  }
};

const listPatientUploadedReports = async (req, res, next) => {
  try {
    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002/api/patients';

    const response = await axios.get(`${patientServiceUrl}/reports`, {
      params: {
        patientAuthUserId: req.query.patientAuthUserId || ''
      },
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    const message = error.response?.data?.message || 'Unable to fetch patient reports';
    res.status(error.response?.status || 500);
    next(new Error(message));
  }
};

const getPublicDoctorProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.params.authUserId });

    if (!profile) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }

    res.status(200).json({
      profile: {
        authUserId: profile.authUserId,
        fullName: profile.fullName,
        profilePhoto: profile.profilePhoto,
        specialization: profile.specialization,
        hospitalOrClinicName: profile.hospitalOrClinicName,
        consultationFee: profile.consultationFee,
        city: profile.city,
        district: profile.district,
        availabilityNotes: profile.availabilityNotes,
        availabilitySchedule: profile.availabilitySchedule || []
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateMyAvailability,
  issueDigitalPrescription,
  listPatientUploadedReports,
  getPublicDoctorProfile
};
