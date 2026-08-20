const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const QueueCounter = require('../models/QueueCounter');

const dateKey = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const appointmentDateKey = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return dateKey(value);
};

const ensureQueueEntryForAppointment = async (appointmentOrId, queueDate = dateKey()) => {
  const appointmentId = appointmentOrId?._id || appointmentOrId;
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment || appointment.status === 'cancelled') return;
      if (appointment.queueDate === queueDate && appointment.queueStatus) {
        if (appointment.status === 'no_show' && appointment.queueStatus !== 'no_show') {
          result = await Appointment.findByIdAndUpdate(appointment._id, { $set: { queueStatus: 'no_show', noShowAt: appointment.noShowAt || new Date() } }, { new: true, session, runValidators: true });
        } else result = appointment;
        return;
      }
      const counter = await QueueCounter.findOneAndUpdate(
        { doctor: appointment.doctor, queueDate },
        { $inc: { sequence: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      );
      const queueStatus = appointment.status === 'completed' ? 'completed' : appointment.status === 'no_show' ? 'no_show' : 'waiting';
      result = await Appointment.findOneAndUpdate(
        { _id: appointmentId, $or: [{ queueDate: { $exists: false } }, { queueDate: { $ne: queueDate } }] },
        { $set: { queueDate, queueNumber: counter.sequence, queueStatus } },
        { new: true, session, runValidators: true },
      );
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { dateKey, appointmentDateKey, ensureQueueEntryForAppointment };
