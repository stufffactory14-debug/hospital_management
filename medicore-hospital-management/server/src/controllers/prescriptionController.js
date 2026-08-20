const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');

const prescriptionFields = ['patient', 'doctor', 'appointment', 'diagnosis', 'notes', 'medicines'];

const pickPrescriptionFields = (body) => Object.fromEntries(
  prescriptionFields
    .filter((field) => Object.hasOwn(body, field))
    .map((field) => [field, body[field]])
);

const populatePrescription = (query) => query
  .populate('patient', 'name phone email')
  .populate('doctor', 'name specialization email')
  .populate('appointment', 'dateTime reason status');

const sendInvalidIdResponse = (res) =>
  res.status(400).json({ success: false, message: 'Invalid prescription ID' });

const sendNotFoundResponse = (res) =>
  res.status(404).json({ success: false, message: 'Prescription not found' });

const sendValidationError = (res, error) =>
  res.status(400).json({ success: false, message: error.message });

const serializePrescription = (prescription, role) => {
  const data = prescription.toObject ? prescription.toObject() : { ...prescription };
  if (role === 'receptionist') {
    delete data.diagnosis;
    delete data.notes;
    delete data.medicines;
  }
  return data;
};

const sameReference = (left, right) => String(left) === String(right);

const isDoctorUser = (req) => req.user?.role === 'doctor';

const getDoctorScope = (req, res, requestedDoctor) => {
  if (!isDoctorUser(req)) return null;
  if (!req.user.doctorId) {
    res.status(403).json({ success: false, message: 'Doctor account is not linked to a Doctor profile' });
    return undefined;
  }
  if (requestedDoctor && String(requestedDoctor) !== String(req.user.doctorId)) {
    res.status(403).json({ success: false, message: 'Doctors can only access their own prescriptions' });
    return undefined;
  }
  return req.user.doctorId;
};

const validateReferences = async (patientId, doctorId, appointmentId) => {
  if (!patientId) return { status: 400, message: 'Patient is required' };
  if (!doctorId) return { status: 400, message: 'Doctor is required' };
  if (!mongoose.isValidObjectId(patientId)) return { status: 400, message: 'Invalid patient ID' };
  if (!mongoose.isValidObjectId(doctorId)) return { status: 400, message: 'Invalid doctor ID' };
  if (appointmentId && !mongoose.isValidObjectId(appointmentId)) return { status: 400, message: 'Invalid appointment ID' };

  const [patient, doctor, appointment] = await Promise.all([
    Patient.findById(patientId),
    Doctor.findById(doctorId),
    appointmentId ? Appointment.findById(appointmentId) : null,
  ]);

  if (!patient) return { status: 404, message: 'Patient not found' };
  if (!doctor) return { status: 404, message: 'Doctor not found' };
  if (appointmentId && !appointment) return { status: 404, message: 'Appointment not found' };

  if (appointmentId && !sameReference(appointment.patient, patientId)) {
    return { status: 400, message: 'Appointment patient does not match prescription patient' };
  }

  if (appointmentId && !sameReference(appointment.doctor, doctorId)) {
    return { status: 400, message: 'Appointment doctor does not match prescription doctor' };
  }

  return null;
};

const getPrescriptions = async (req, res) => {
  try {
    const requestedDoctor = req.query.doctor;
    if (requestedDoctor && !mongoose.isValidObjectId(requestedDoctor)) return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    const doctorId = getDoctorScope(req, res, requestedDoctor);
    if (isDoctorUser(req) && doctorId === undefined) return;
    const filter = doctorId ? { doctor: doctorId } : {};
    const { search, date } = req.query;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, message: 'Prescription date must use YYYY-MM-DD format' });
      const from = new Date(`${date}T00:00:00.000Z`); const to = new Date(from); to.setUTCDate(to.getUTCDate() + 1);
      if (Number.isNaN(from.getTime())) return res.status(400).json({ success: false, message: 'Invalid prescription date' });
      filter.createdAt = { $gte: from, $lt: to };
    }
    if (search?.trim()) {
      const expression = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [patients, doctors] = await Promise.all([Patient.find({ name: expression }).select('_id'), Doctor.find({ name: expression }).select('_id')]);
      filter.$or = [{ patient: { $in: patients.map((patient) => patient._id) } }, { doctor: { $in: doctors.map((doctor) => doctor._id) } }];
    }
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
    const paginated = Object.hasOwn(req.query, 'page') || Object.hasOwn(req.query, 'limit') || Boolean(search) || Boolean(date);
    const [prescriptions, total] = await Promise.all([
      paginated ? populatePrescription(Prescription.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)) : populatePrescription(Prescription.find(filter).sort({ createdAt: -1 })),
      Prescription.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: prescriptions.map((prescription) => serializePrescription(prescription, req.user.role)), page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve prescriptions' });
  }
};

const getPrescriptionById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const doctorId = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorId === undefined) return;
    const prescription = await populatePrescription(Prescription.findOne({ _id: req.params.id, ...(doctorId ? { doctor: doctorId } : {}) }));

    if (!prescription) return sendNotFoundResponse(res);
    return res.status(200).json({ success: true, data: serializePrescription(prescription, req.user.role) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve prescription' });
  }
};

const createPrescription = async (req, res) => {
  try {
    const payload = pickPrescriptionFields(req.body);
    const doctorId = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorId === undefined) return;
    if (doctorId && payload.doctor && !sameReference(payload.doctor, doctorId)) {
      return res.status(403).json({ success: false, message: 'Doctors can only create prescriptions under their own Doctor profile' });
    }
    if (doctorId) payload.doctor = doctorId;
    const referenceError = await validateReferences(payload.patient, payload.doctor, payload.appointment);

    if (referenceError) {
      return res.status(referenceError.status).json({ success: false, message: referenceError.message });
    }

    const prescription = await Prescription.create(payload);
    return res.status(201).json({ success: true, data: serializePrescription(prescription, req.user.role) });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidationError(res, error);
    return res.status(500).json({ success: false, message: 'Unable to create prescription' });
  }
};

const updatePrescription = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const doctorScope = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorScope === undefined) return;
    const existingPrescription = await Prescription.findOne({ _id: req.params.id, ...(doctorScope ? { doctor: doctorScope } : {}) });
    if (!existingPrescription) return sendNotFoundResponse(res);

    const payload = pickPrescriptionFields(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No prescription fields provided for update' });
    }

    if (doctorScope && payload.doctor && !sameReference(payload.doctor, doctorScope)) {
      return res.status(403).json({ success: false, message: 'Doctors can only update prescriptions under their own Doctor profile' });
    }
    const patientId = payload.patient ?? existingPrescription.patient;
    const doctorId = doctorScope || payload.doctor || existingPrescription.doctor;
    if (doctorScope) payload.doctor = doctorScope;
    const appointmentId = Object.hasOwn(payload, 'appointment') ? payload.appointment : existingPrescription.appointment;
    const referenceError = await validateReferences(patientId, doctorId, appointmentId);

    if (referenceError) {
      return res.status(referenceError.status).json({ success: false, message: referenceError.message });
    }

    const prescription = await populatePrescription(Prescription.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }));

    if (!prescription) return sendNotFoundResponse(res);
    return res.status(200).json({ success: true, data: serializePrescription(prescription, req.user.role) });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidationError(res, error);
    return res.status(500).json({ success: false, message: 'Unable to update prescription' });
  }
};

const deletePrescription = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const doctorScope = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorScope === undefined) return;
    const prescription = await Prescription.findOneAndDelete({ _id: req.params.id, ...(doctorScope ? { doctor: doctorScope } : {}) });
    if (!prescription) return sendNotFoundResponse(res);
    return res.status(200).json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete prescription' });
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
};
