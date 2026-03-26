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
          availabilityNotes: req.body.availabilityNotes ?? ''
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

module.exports = {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  issueDigitalPrescription,
  listPatientUploadedReports
};
