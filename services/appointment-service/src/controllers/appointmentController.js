const Appointment = require('../models/Appointment');
const Counter = require('../models/Counter');

const getNextAppointmentNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'appointment_number' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return counter.seq;
};

const bookAppointment = async (req, res, next) => {
  try {
    const {
      doctorAuthUserId,
      doctorName,
      specialization,
      hospitalOrClinicName,
      doctorProfilePhoto,
      channellingFee,
      appointmentType,
      appointmentDate,
      appointmentTimeSlot,
      patientName,
      patientEmail,
      patientPhoneNumber,
      patientAddress
    } = req.body;

    if (!doctorAuthUserId || !appointmentDate || !appointmentTimeSlot || !appointmentType) {
      res.status(400);
      throw new Error('Doctor, appointment type, date and time slot are required');
    }

    if (!patientName || !patientEmail || !patientPhoneNumber) {
      res.status(400);
      throw new Error('Patient name, email and phone number are required');
    }

    const appointment = await Appointment.create({
      appointmentNumber: await getNextAppointmentNumber(),
      patientAuthUserId: req.user.userId,
      doctorAuthUserId,
      doctorName: doctorName || 'Doctor',
      specialization: specialization || '',
      hospitalOrClinicName: hospitalOrClinicName || '',
      doctorProfilePhoto: doctorProfilePhoto || '',
      channellingFee: Number(channellingFee) || 0,
      appointmentType,
      appointmentDate,
      appointmentTimeSlot,
      patientName,
      patientEmail,
      patientPhoneNumber,
      patientAddress: patientAddress || ''
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error('Selected time slot is already booked for this doctor'));
    }

    return next(error);
  }
};

const listMyPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientAuthUserId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({ count: appointments.length, appointments });
  } catch (error) {
    next(error);
  }
};

const listMyDoctorAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctorAuthUserId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({ count: appointments.length, appointments });
  } catch (error) {
    next(error);
  }
};

const cancelMyPatientAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (appointment.patientAuthUserId !== req.user.userId) {
      res.status(403);
      throw new Error('Not authorized to cancel this appointment');
    }

    if (appointment.status === 'cancelled') {
      res.status(400);
      throw new Error('Appointment is already cancelled');
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  listMyPatientAppointments,
  listMyDoctorAppointments,
  cancelMyPatientAppointment
};
