const mongoose = require('mongoose');

const queueCounterSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    queueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

queueCounterSchema.index({ doctor: 1, queueDate: 1 }, { unique: true });

module.exports = mongoose.model('QueueCounter', queueCounterSchema);
