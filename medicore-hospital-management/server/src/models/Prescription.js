const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Medicine dosage is required'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Medicine frequency is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Medicine duration is required'],
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    medicines: {
      type: [medicineSchema],
      required: [true, 'At least one medicine is required'],
      validate: {
        validator: (medicines) => Array.isArray(medicines) && medicines.length > 0,
        message: 'At least one medicine is required',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
