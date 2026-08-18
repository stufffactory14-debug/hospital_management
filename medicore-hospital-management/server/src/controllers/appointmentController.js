const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled'];
const ALLOWED_STATUS_TRANSITIONS = {
  scheduled: ['scheduled', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid appointment ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Appointment not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

const parseDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const findSchedulingConflict = async ({ patientId, doctorId, dateTime, excludeId }) => {
  const exclusion = excludeId ? { _id: { $ne: excludeId } } : {};
  const doctorConflict = await Appointment.findOne({ ...exclusion, doctor: doctorId, dateTime, status: { $ne: 'cancelled' } });

  if (doctorConflict) {
    return { message: 'Doctor already has an appointment at this time' };
  }

  const patientConflict = await Appointment.findOne({ ...exclusion, patient: patientId, dateTime, status: { $ne: 'cancelled' } });

  if (patientConflict) {
    return { message: 'Patient already has an appointment at this time' };
  }

  return null;
};

const validateStatusTransition = (currentStatus, nextStatus) => {
  if (!VALID_STATUSES.includes(nextStatus)) {
    return 'Appointment status must be scheduled, completed, or cancelled';
  }

  if (!ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return `Appointment status cannot change from ${currentStatus} to ${nextStatus}`;
  }

  return null;
};

const validateReferences = async (patientId, doctorId) => {
  if (!patientId) {
    return { message: 'Patient is required' };
  }

  if (!doctorId) {
    return { message: 'Doctor is required' };
  }

  if (!mongoose.isValidObjectId(patientId)) {
    return { message: 'Invalid patient ID' };
  }

  if (!mongoose.isValidObjectId(doctorId)) {
    return { message: 'Invalid doctor ID' };
  }

  const [patient, doctor] = await Promise.all([
    Patient.findById(patientId),
    Doctor.findById(doctorId),
  ]);

  if (!patient) {
    return { message: 'Patient not found' };
  }

  if (!doctor) {
    return { message: 'Doctor not found' };
  }

  return null;
};

const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ dateTime: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve appointments' });
  }
};

const getAppointmentById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve appointment' });
  }
};

const createAppointment = async (req, res) => {
  try {
    const referenceError = await validateReferences(req.body.patient, req.body.doctor);

    if (referenceError) {
      return res.status(400).json({ success: false, message: referenceError.message });
    }

    const dateTime = parseDateTime(req.body.dateTime);
    if (!dateTime) {
      return res.status(400).json({ success: false, message: 'Appointment date and time must be valid' });
    }

    const conflict = await findSchedulingConflict({
      patientId: req.body.patient,
      doctorId: req.body.doctor,
      dateTime,
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: conflict.message });
    }

    const appointment = await Appointment.create(req.body);
    return res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to create appointment' });
  }
};

const updateAppointment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const existingAppointment = await Appointment.findById(req.params.id);

    if (!existingAppointment) {
      return sendNotFoundResponse(res);
    }

    const patientId = req.body.patient ?? existingAppointment.patient;
    const doctorId = req.body.doctor ?? existingAppointment.doctor;
    const dateTime = parseDateTime(req.body.dateTime ?? existingAppointment.dateTime);
    const nextStatus = req.body.status ?? existingAppointment.status;
    const referenceError = await validateReferences(patientId, doctorId);

    if (referenceError) {
      return res.status(400).json({ success: false, message: referenceError.message });
    }

    if (!dateTime) {
      return res.status(400).json({ success: false, message: 'Appointment date and time must be valid' });
    }

    const statusError = validateStatusTransition(existingAppointment.status, nextStatus);
    if (statusError) {
      return res.status(400).json({ success: false, message: statusError });
    }

    const conflict = await findSchedulingConflict({
      patientId,
      doctorId,
      dateTime,
      excludeId: req.params.id,
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: conflict.message });
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to update appointment' });
  }
};

const deleteAppointment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete appointment' });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
