const fs = require('fs');
const path = require('path');

const PatientProfile = require('../models/PatientProfile');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');

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

const buildProfileFromRequest = (body, existing = {}) => ({
  fullName: body.fullName ?? existing.fullName,
  email: body.email ?? existing.email,
  phoneNumber: body.phoneNumber ?? existing.phoneNumber,
  dateOfBirth: body.dateOfBirth || null,
  gender: body.gender ?? existing.gender,
  nationalId: body.nationalId ?? existing.nationalId,
  profilePhoto: body.profilePhoto ?? existing.profilePhoto,
  bloodGroup: body.bloodGroup ?? existing.bloodGroup,
  knownAllergies: body.knownAllergies !== undefined ? parseStringList(body.knownAllergies) : existing.knownAllergies,
  medicalConditions: body.medicalConditions !== undefined ? parseStringList(body.medicalConditions) : existing.medicalConditions,
  currentMedications: body.currentMedications !== undefined ? parseStringList(body.currentMedications) : existing.currentMedications,
  emergencyContactName: body.emergencyContactName ?? existing.emergencyContactName,
  emergencyContactPhone: body.emergencyContactPhone ?? existing.emergencyContactPhone,
  addressLine: body.addressLine ?? existing.addressLine,
  city: body.city ?? existing.city,
  district: body.district ?? existing.district,
  postalCode: body.postalCode ?? existing.postalCode
});

const getMyProfile = async (req, res, next) => {
  try {
    const authUserId = req.user.userId;
    let profile = await PatientProfile.findOne({ authUserId });

    if (!profile) {
      profile = await PatientProfile.create({
        authUserId,
        fullName: '',
        email: '',
        phoneNumber: ''
      });
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const authUserId = req.user.userId;

    const existingProfile = await PatientProfile.findOne({ authUserId });
    const nextProfileData = buildProfileFromRequest(req.body, existingProfile || {});

    const profile = await PatientProfile.findOneAndUpdate(
      { authUserId },
      {
        $set: {
          authUserId,
          ...nextProfileData
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    next(error);
  }
};

const uploadMedicalReport = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('File is required');
    }

    const authUserId = req.user.userId;
    const title = req.body.title || req.file.originalname;

    const report = await MedicalReport.create({
      patientAuthUserId: authUserId,
      title,
      description: req.body.description || '',
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });

    res.status(201).json({ message: 'Medical report uploaded successfully', report });
  } catch (error) {
    next(error);
  }
};

const listMedicalReports = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ patientAuthUserId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

const listPatientReportsForDoctor = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.patientAuthUserId) {
      filter.patientAuthUserId = req.query.patientAuthUserId;
    }

    const reports = await MedicalReport.find(filter).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

const listMyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patientAuthUserId: req.user.userId }).sort({ issuedAt: -1 });

    res.status(200).json({ count: prescriptions.length, prescriptions });
  } catch (error) {
    next(error);
  }
};

const issuePrescription = async (req, res, next) => {
  try {
    const {
      patientAuthUserId,
      doctorName,
      diagnosis,
      medications,
      dosageInstructions,
      testsRecommended,
      followUpDate,
      templateName,
      notes
    } = req.body;

    if (!patientAuthUserId) {
      res.status(400);
      throw new Error('patientAuthUserId is required');
    }

    const prescription = await Prescription.create({
      patientAuthUserId,
      doctorAuthUserId: req.user.userId,
      doctorName: doctorName || 'Doctor',
      diagnosis: diagnosis || '',
      medications: parseStringList(medications),
      dosageInstructions: dosageInstructions || '',
      testsRecommended: parseStringList(testsRecommended),
      followUpDate: followUpDate || null,
      templateName: templateName || '',
      notes: notes || ''
    });

    res.status(201).json({ message: 'Prescription issued successfully', prescription });
  } catch (error) {
    next(error);
  }
};

const deleteReportByDoctor = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.reportId);

    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    const diskPath = path.join(process.cwd(), 'uploads', path.basename(report.filePath));
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    await report.deleteOne();

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMedicalReport,
  listMedicalReports,
  listPatientReportsForDoctor,
  deleteReportByDoctor,
  listMyPrescriptions,
  issuePrescription
};
