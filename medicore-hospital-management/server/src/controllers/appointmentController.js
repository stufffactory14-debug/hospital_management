const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid appointment ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Appointment not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

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
    const referenceError = await validateReferences(patientId, doctorId);

    if (referenceError) {
      return res.status(400).json({ success: false, message: referenceError.message });
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
