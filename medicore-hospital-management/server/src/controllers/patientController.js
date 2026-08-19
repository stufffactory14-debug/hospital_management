const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid patient ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Patient not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

const isDoctor = (req) => req.user?.role === 'doctor';
const doctorPatientIds = async (req, res) => {
  if (!isDoctor(req)) return null;
  if (!req.user.doctorId) {
    res.status(403).json({ success: false, message: 'Doctor account is not linked to a Doctor profile' });
    return undefined;
  }
  const [appointmentPatients, prescriptionPatients] = await Promise.all([
    Appointment.distinct('patient', { doctor: req.user.doctorId }),
    Prescription.distinct('patient', { doctor: req.user.doctorId }),
  ]);
  return [...new Set([...appointmentPatients, ...prescriptionPatients].map(String))];
};
const serializePatient = (patient, role) => {
  const data = patient.toObject ? patient.toObject() : { ...patient };
  if (role === 'receptionist') delete data.medicalHistory;
  return data;
};

const getPatients = async (req, res) => {
  try {
    const ids = await doctorPatientIds(req, res);
    if (isDoctor(req) && ids === undefined) return;
    const patients = await Patient.find(ids ? { _id: { $in: ids } } : {}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: patients.map((patient) => serializePatient(patient, req.user.role)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve patients' });
  }
};

const getPatientById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const ids = await doctorPatientIds(req, res);
    if (isDoctor(req) && ids === undefined) return;
    const patient = await Patient.findOne({ _id: req.params.id, ...(ids ? { _id: { $in: ids } } : {}) });

    if (!patient) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: serializePatient(patient, req.user.role) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve patient' });
  }
};

const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    return res.status(201).json({ success: true, data: serializePatient(patient, req.user.role) });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to create patient' });
  }
};

const updatePatient = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: serializePatient(patient, req.user.role) });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to update patient' });
  }
};

const deletePatient = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete patient' });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
