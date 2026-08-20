const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid doctor ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Doctor not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

const getDoctors = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
    const search = String(req.query.search || '').trim();
    const paginated = Object.hasOwn(req.query, 'page') || Object.hasOwn(req.query, 'limit') || Boolean(search);
    const filter = {};
    if (search) {
      const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: expression }, { email: expression }, { specialization: expression }];
    }
    const projection = 'name email phone specialization department qualification experience createdAt updatedAt';
    const [doctors, total] = await Promise.all([
      paginated ? Doctor.find(filter).select(projection).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit) : Doctor.find(filter).select(projection).sort({ createdAt: -1 }),
      Doctor.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: doctors, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve doctors' });
  }
};

const getDoctorById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const doctor = await Doctor.findById(req.params.id).select('name email phone specialization department qualification experience createdAt updatedAt');

    if (!doctor) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve doctor' });
  }
};

const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    return res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to create doctor' });
  }
};

const updateDoctor = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendValidationError(res, error);
    }

    return res.status(500).json({ success: false, message: 'Unable to update doctor' });
  }
};

const deleteDoctor = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return sendNotFoundResponse(res);
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete doctor' });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
