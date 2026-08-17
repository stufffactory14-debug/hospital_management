const mongoose = require('mongoose');
const Patient = require('../models/Patient');

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid patient ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Patient not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve patients' });
  }
};

const getPatientById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: patient });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve patient' });
  }
};

const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    return res.status(201).json({ success: true, data: patient });
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

    return res.status(200).json({ success: true, data: patient });
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
