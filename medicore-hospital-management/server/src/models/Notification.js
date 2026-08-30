const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    relatedAppointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    relatedQueue: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    channel: { type: String, enum: ['in_app', 'sms', 'whatsapp'], default: 'in_app' },
    deliveryStatus: { type: String, enum: ['pending', 'sent', 'failed', 'provider_not_configured'], default: 'sent' },
    deliveryError: { type: String, trim: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index(
  { type: 1, relatedQueue: 1 },
  { unique: true, partialFilterExpression: { type: 'patient_queue_called', relatedQueue: { $exists: true } } }
);

module.exports = mongoose.model('Notification', notificationSchema);
