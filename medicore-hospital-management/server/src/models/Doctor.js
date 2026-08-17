const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Doctor phone is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Doctor specialization is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
