const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required'],
    },
    dateTime: {
      type: Date,
      required: [true, 'Appointment date and time is required'],
    },
    reason: {
      type: String,
      required: [true, 'Appointment reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'completed', 'cancelled'],
        message: 'Appointment status must be scheduled, completed, or cancelled',
      },
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
