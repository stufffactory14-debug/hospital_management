const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');

const formatTime = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const recipientsForAppointment = async (appointment) => {
  const users = await User.find({ active: true, $or: [
    { role: { $in: ['admin', 'receptionist'] } },
    { role: 'doctor', doctor: appointment.doctor },
  ] }).select('_id');
  return users.map((user) => user._id);
};

const notifyAppointmentEvent = async (appointmentId, event) => {
  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient', 'name').select('patient doctor dateTime status');
    if (!appointment) return;
    const patientName = appointment.patient?.name || 'A patient';
    const labels = {
      scheduled: ['New appointment scheduled', `${patientName} has an appointment scheduled for ${formatTime(appointment.dateTime)}.`],
      cancelled: ['Appointment cancelled', `${patientName}'s appointment for ${formatTime(appointment.dateTime)} was cancelled.`],
      completed: ['Appointment completed', `${patientName}'s appointment at ${formatTime(appointment.dateTime)} was completed.`],
      called: ['Patient called', `${patientName} has been called for the ${formatTime(appointment.dateTime)} appointment.`],
      in_consultation: ['Consultation started', `${patientName}'s consultation has started.`],
      queue_completed: ['Consultation completed', `${patientName}'s consultation has been completed.`],
    };
    const [title, message] = labels[event] || ['Appointment update', `${patientName}'s appointment was updated.`];
    const recipients = await recipientsForAppointment(appointment);
    await Promise.all(recipients.map(async (recipient) => {
      const duplicate = await Notification.exists({ recipient, type: `appointment_${event}`, relatedAppointment: appointment._id });
      if (!duplicate) await Notification.create({ recipient, type: `appointment_${event}`, title, message, relatedAppointment: appointment._id });
    }));
  } catch (error) {
    // Notification delivery must not make an appointment or queue operation fail.
  }
};

const findUpcomingAppointments = ({ from = new Date(), minutes = 60 } = {}) => {
  const to = new Date(from.getTime() + minutes * 60 * 1000);
  return Appointment.find({ dateTime: { $gte: from, $lt: to }, status: 'scheduled' }).sort({ dateTime: 1 });
};

module.exports = { notifyAppointmentEvent, findUpcomingAppointments };
