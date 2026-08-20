const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const QueueCounter = require('../models/QueueCounter');

const transitions = {
  waiting: ['waiting', 'called', 'cancelled'],
  called: ['called', 'in_consultation', 'cancelled'],
  in_consultation: ['in_consultation', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};

const today = () => new Date().toISOString().slice(0, 10);
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const dateWindow = (date) => {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { $gte: from, $lt: to };
};
const isDoctor = (req) => req.user?.role === 'doctor';
const scopeDoctor = (req, res, requested) => {
  if (!isDoctor(req)) return requested || null;
  if (!req.user.doctorId) {
    res.status(403).json({ success: false, message: 'Doctor account is not linked to a Doctor profile' });
    return undefined;
  }
  if (requested && String(requested) !== String(req.user.doctorId)) {
    res.status(403).json({ success: false, message: 'Doctors can only access their own queue' });
    return undefined;
  }
  return req.user.doctorId;
};
const populate = (query) => query.populate('patient', 'name phone email').populate('doctor', 'name specialization department');

const assignQueueEntry = async (appointmentId, queueDate) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment || appointment.status === 'cancelled') return;
      if (appointment.queueDate === queueDate && appointment.queueStatus) { result = appointment; return; }
      const counter = await QueueCounter.findOneAndUpdate(
        { doctor: appointment.doctor, queueDate },
        { $inc: { sequence: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session }
      );
      const queueStatus = appointment.status === 'completed' ? 'completed' : 'waiting';
      result = await Appointment.findOneAndUpdate(
        { _id: appointmentId, $or: [{ queueDate: { $exists: false } }, { queueDate: { $ne: queueDate } }] },
        { $set: { queueDate, queueNumber: counter.sequence, queueStatus } },
        { new: true, session, runValidators: true }
      );
    });
    return result;
  } finally { await session.endSession(); }
};

const getQueue = async (req, res) => {
  const queueDate = req.query.date || today();
  if (!validDate(queueDate)) return res.status(400).json({ success: false, message: 'Queue date must use YYYY-MM-DD format' });
  if (req.query.doctor && !mongoose.isValidObjectId(req.query.doctor)) return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
  const doctor = scopeDoctor(req, res, req.query.doctor);
  if (isDoctor(req) && doctor === undefined) return;
  try {
    const filter = { dateTime: dateWindow(queueDate), status: { $ne: 'cancelled' }, ...(doctor ? { doctor } : {}) };
    const appointments = await Appointment.find(filter).sort({ dateTime: 1, createdAt: 1 });
    await Promise.all(appointments.map((appointment) => assignQueueEntry(appointment._id, queueDate)));
    const queueFilter = { queueDate, queueStatus: { $ne: 'cancelled' }, ...(doctor ? { doctor } : {}), ...(req.query.status ? { queueStatus: req.query.status } : {}) };
    const queue = await populate(Appointment.find(queueFilter).sort({ queueNumber: 1 }));
    return res.status(200).json({ success: true, data: queue });
  } catch (error) {
    if ([20, 251].includes(error.code) || /transaction|replica set/i.test(error.message || '')) return res.status(503).json({ success: false, message: 'Queue assignment requires MongoDB transaction support' });
    return res.status(500).json({ success: false, message: 'Unable to retrieve queue' });
  }
};

const getQueueEntry = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid queue entry ID' });
  try {
    const doctor = scopeDoctor(req, res);
    if (isDoctor(req) && doctor === undefined) return;
    const entry = await populate(Appointment.findOne({ _id: req.params.id, queueDate: { $exists: true }, ...(doctor ? { doctor } : {}) }));
    if (!entry) return res.status(404).json({ success: false, message: 'Queue entry not found' });
    return res.status(200).json({ success: true, data: entry });
  } catch (error) { return res.status(500).json({ success: false, message: 'Unable to retrieve queue entry' }); }
};

const updateQueueStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid queue entry ID' });
  const nextStatus = req.body.status;
  if (!Object.hasOwn(transitions, nextStatus)) return res.status(400).json({ success: false, message: 'Invalid queue status' });
  try {
    const doctor = scopeDoctor(req, res);
    if (isDoctor(req) && doctor === undefined) return;
    const session = await mongoose.startSession();
    let updated;
    try {
      await session.withTransaction(async () => {
        const entry = await Appointment.findOne({ _id: req.params.id, queueDate: { $exists: true }, ...(doctor ? { doctor } : {}) }).session(session);
        if (!entry) { const error = new Error('Queue entry not found'); error.status = 404; throw error; }
        const current = entry.queueStatus || 'waiting';
        const roleAllowed = req.user.role === 'admin'
          || (req.user.role === 'receptionist' && ['called', 'cancelled'].includes(nextStatus))
          || (req.user.role === 'doctor' && ['called', 'in_consultation', 'completed'].includes(nextStatus));
        if (!roleAllowed) { const error = new Error('You do not have permission to perform this queue transition'); error.status = 403; throw error; }
        if (!transitions[current].includes(nextStatus)) { const error = new Error(`Queue status cannot change from ${current} to ${nextStatus}`); error.status = 400; throw error; }
        const now = new Date();
        const timestamps = nextStatus === 'called' ? { calledAt: now } : nextStatus === 'in_consultation' ? { consultationStartedAt: now } : nextStatus === 'completed' ? { consultationCompletedAt: now } : {};
        const update = { $set: { queueStatus: nextStatus, ...timestamps } };
        if (nextStatus === 'completed') update.$set.status = 'completed';
        if (nextStatus === 'cancelled') update.$set.status = 'cancelled';
        updated = await Appointment.findByIdAndUpdate(entry._id, update, { new: true, session, runValidators: true });
      });
    } finally { await session.endSession(); }
    const populated = await populate(Appointment.findById(updated._id));
    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    if ([20, 251].includes(error.code) || /transaction|replica set/i.test(error.message || '')) return res.status(503).json({ success: false, message: 'Queue updates require MongoDB transaction support' });
    return res.status(500).json({ success: false, message: 'Unable to update queue status' });
  }
};

module.exports = { getQueue, getQueueEntry, updateQueueStatus };
