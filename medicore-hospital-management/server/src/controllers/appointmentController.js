const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { notifyAppointmentEvent } = require('../services/notificationService');
const { dateKey, appointmentDateKey, ensureQueueEntryForAppointment } = require('../services/queueService');

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];
const ALLOWED_STATUS_TRANSITIONS = {
  scheduled: ['scheduled', 'completed', 'cancelled', 'no_show'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  no_show: ['no_show'],
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

const isDoctorUser = (req) => req.user?.role === 'doctor';

const getDoctorScope = (req, res, requestedDoctor) => {
  if (!isDoctorUser(req)) return null;
  if (!req.user.doctorId) {
    res.status(403).json({ success: false, message: 'Doctor account is not linked to a Doctor profile' });
    return undefined;
  }
  if (requestedDoctor && String(requestedDoctor) !== String(req.user.doctorId)) {
    res.status(403).json({ success: false, message: 'Doctors can only access their own appointments' });
    return undefined;
  }
  return req.user.doctorId;
};

const findSchedulingConflict = async ({ patientId, doctorId, dateTime, excludeId }) => {
  const exclusion = excludeId ? { _id: { $ne: excludeId } } : {};
  const doctorConflict = await Appointment.findOne({ ...exclusion, doctor: doctorId, dateTime, status: { $nin: ['cancelled', 'no_show'] } });

  if (doctorConflict) {
    return { message: 'Doctor already has an appointment at this time' };
  }

  const patientConflict = await Appointment.findOne({ ...exclusion, patient: patientId, dateTime, status: { $nin: ['cancelled', 'no_show'] } });

  if (patientConflict) {
    return { message: 'Patient already has an appointment at this time' };
  }

  return null;
};

const validateStatusTransition = (currentStatus, nextStatus) => {
  if (!VALID_STATUSES.includes(nextStatus)) {
    return 'Appointment status must be scheduled, completed, cancelled, or no-show';
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
    const requestedDoctor = req.query.doctor;
    if (requestedDoctor && !mongoose.isValidObjectId(requestedDoctor)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }
    const doctorId = getDoctorScope(req, res, requestedDoctor);
    if (isDoctorUser(req) && doctorId === undefined) return;
    const filter = doctorId ? { doctor: doctorId } : {};
    const { status, date, search } = req.query;
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    if (status) filter.status = status;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, message: 'Appointment date must use YYYY-MM-DD format' });
      const from = new Date(`${date}T00:00:00.000Z`); const to = new Date(from); to.setUTCDate(to.getUTCDate() + 1);
      if (Number.isNaN(from.getTime())) return res.status(400).json({ success: false, message: 'Invalid appointment date' });
      filter.dateTime = { $gte: from, $lt: to };
    }
    if (search?.trim()) {
      const expression = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [patients, doctors] = await Promise.all([Patient.find({ name: expression }).select('_id'), Doctor.find({ name: expression }).select('_id')]);
      filter.$or = [{ patient: { $in: patients.map((patient) => patient._id) } }, { doctor: { $in: doctors.map((doctor) => doctor._id) } }];
    }
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
    const paginated = Object.hasOwn(req.query, 'page') || Object.hasOwn(req.query, 'limit') || status || date || search;
    const [appointments, total] = await Promise.all([
      paginated ? Appointment.find(filter).sort({ dateTime: 1 }).skip((page - 1) * limit).limit(limit) : Appointment.find(filter).sort({ dateTime: 1 }),
      Appointment.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: appointments, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve appointments' });
  }
};

const getAppointmentById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendInvalidIdResponse(res);
  }

  try {
    const doctorId = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorId === undefined) return;
    const appointment = await Appointment.findOne({ _id: req.params.id, ...(doctorId ? { doctor: doctorId } : {}) });

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
    const doctorId = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorId === undefined) return;
    if (doctorId && req.body.doctor && String(req.body.doctor) !== String(doctorId)) {
      return res.status(403).json({ success: false, message: 'Doctors can only create appointments for their own Doctor profile' });
    }
    const requestedDoctorId = doctorId || req.body.doctor;
    const referenceError = await validateReferences(req.body.patient, requestedDoctorId);

    if (referenceError) {
      return res.status(400).json({ success: false, message: referenceError.message });
    }

    const dateTime = parseDateTime(req.body.dateTime);
    if (!dateTime) {
      return res.status(400).json({ success: false, message: 'Appointment date and time must be valid' });
    }

    const conflict = await findSchedulingConflict({
      patientId: req.body.patient,
      doctorId: requestedDoctorId,
      dateTime,
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: conflict.message });
    }

    const payload = { ...req.body, doctor: requestedDoctorId, dateTime };
    const appointment = await Appointment.create(payload);
    const queueDate = appointmentDateKey(req.body.dateTime) || dateKey(dateTime);
    if (queueDate === dateKey()) {
      await ensureQueueEntryForAppointment(appointment._id, queueDate);
    }
    await notifyAppointmentEvent(appointment._id, 'scheduled');
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
    const doctorScope = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorScope === undefined) return;
    const existingAppointment = await Appointment.findOne({ _id: req.params.id, ...(doctorScope ? { doctor: doctorScope } : {}) });

    if (!existingAppointment) {
      return sendNotFoundResponse(res);
    }

    const patientId = req.body.patient ?? existingAppointment.patient;
    if (doctorScope && req.body.doctor && String(req.body.doctor) !== String(doctorScope)) {
      return res.status(403).json({ success: false, message: 'Doctors can only update appointments for their own Doctor profile' });
    }
    const doctorId = doctorScope || req.body.doctor || existingAppointment.doctor;
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

    const payload = { ...req.body, doctor: doctorId, dateTime };
    if (nextStatus === 'no_show') payload.noShowAt = new Date();
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (nextStatus === 'no_show') {
      await ensureQueueEntryForAppointment(appointment._id, appointmentDateKey(req.body.dateTime ?? existingAppointment.dateTime));
    }

    if (existingAppointment.status !== nextStatus && ['cancelled', 'completed', 'no_show'].includes(nextStatus)) {
      await notifyAppointmentEvent(appointment._id, nextStatus);
    }

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
    const doctorScope = getDoctorScope(req, res);
    if (isDoctorUser(req) && doctorScope === undefined) return;
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, ...(doctorScope ? { doctor: doctorScope } : {}) });

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
