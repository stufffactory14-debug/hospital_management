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

const sameReference = (left, right) => String(left) === String(right);

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
    const prescriptions = await populatePrescription(Prescription.find().sort({ createdAt: -1 }));
    return res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve prescriptions' });
  }
};

const getPrescriptionById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const prescription = await populatePrescription(Prescription.findById(req.params.id));

    if (!prescription) return sendNotFoundResponse(res);
    return res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve prescription' });
  }
};

const createPrescription = async (req, res) => {
  try {
    const payload = pickPrescriptionFields(req.body);
    const referenceError = await validateReferences(payload.patient, payload.doctor, payload.appointment);

    if (referenceError) {
      return res.status(referenceError.status).json({ success: false, message: referenceError.message });
    }

    const prescription = await Prescription.create(payload);
    return res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidationError(res, error);
    return res.status(500).json({ success: false, message: 'Unable to create prescription' });
  }
};

const updatePrescription = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const existingPrescription = await Prescription.findById(req.params.id);
    if (!existingPrescription) return sendNotFoundResponse(res);

    const payload = pickPrescriptionFields(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No prescription fields provided for update' });
    }

    const patientId = payload.patient ?? existingPrescription.patient;
    const doctorId = payload.doctor ?? existingPrescription.doctor;
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
    return res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidationError(res, error);
    return res.status(500).json({ success: false, message: 'Unable to update prescription' });
  }
};

const deletePrescription = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendInvalidIdResponse(res);

  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
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
