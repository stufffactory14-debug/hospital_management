const crypto = require('crypto');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');

const allowedFields = ['patient', 'doctor', 'appointment', 'items', 'discount', 'tax', 'paidAmount', 'paymentMethod', 'dueDate', 'notes'];

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const createInputError = (message) => {
  const error = new Error(message);
  error.name = 'InputError';
  return error;
};

const sameReference = (left, right) => String(left) === String(right);

const pickInvoiceFields = (body) => Object.fromEntries(
  allowedFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
);

const parseNonNegativeNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw createInputError(`${fieldName} must be a non-negative number`);
  }
  return roundCurrency(number);
};

const calculateFinancials = ({ items, discount = 0, tax = 0, paidAmount = 0 }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createInputError('At least one invoice item is required');
  }

  const calculatedItems = items.map((item) => {
    if (!item?.description || !String(item.description).trim()) {
      throw createInputError('Item description is required');
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw createInputError('Item quantity must be greater than zero');
    }

    const unitAmount = parseNonNegativeNumber(item.unitAmount, 'Item unit amount');
    return {
      description: String(item.description).trim(),
      quantity,
      unitAmount,
      amount: roundCurrency(quantity * unitAmount),
    };
  });

  const subtotal = roundCurrency(calculatedItems.reduce((sum, item) => sum + item.amount, 0));
  const calculatedDiscount = parseNonNegativeNumber(discount, 'Discount');
  const calculatedTax = parseNonNegativeNumber(tax, 'Tax');
  const total = roundCurrency(subtotal - calculatedDiscount + calculatedTax);

  if (total < 0) {
    throw createInputError('Discount cannot exceed subtotal plus tax');
  }

  const calculatedPaidAmount = parseNonNegativeNumber(paidAmount, 'Paid amount');
  if (calculatedPaidAmount > total) {
    throw createInputError('Paid amount cannot be greater than total');
  }

  const paymentStatus = calculatedPaidAmount === 0
    ? 'unpaid'
    : calculatedPaidAmount < total
      ? 'partial'
      : 'paid';

  return {
    items: calculatedItems,
    subtotal,
    discount: calculatedDiscount,
    tax: calculatedTax,
    total,
    paidAmount: calculatedPaidAmount,
    paymentStatus,
  };
};

const createInvoiceNumber = () => `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const populateInvoice = (query) => query
  .populate('patient', 'name email phone')
  .populate('doctor', 'name specialization')
  .populate('appointment', 'dateTime reason status');

const validateReferences = async (patientId, doctorId, appointmentId) => {
  if (!patientId) return { status: 400, message: 'Patient is required' };
  if (!mongoose.isValidObjectId(patientId)) return { status: 400, message: 'Invalid patient ID' };
  if (doctorId && !mongoose.isValidObjectId(doctorId)) return { status: 400, message: 'Invalid doctor ID' };
  if (appointmentId && !mongoose.isValidObjectId(appointmentId)) return { status: 400, message: 'Invalid appointment ID' };

  const [patient, doctor, appointment] = await Promise.all([
    Patient.findById(patientId),
    doctorId ? Doctor.findById(doctorId) : null,
    appointmentId ? Appointment.findById(appointmentId) : null,
  ]);

  if (!patient) return { status: 404, message: 'Patient not found' };
  if (doctorId && !doctor) return { status: 404, message: 'Doctor not found' };
  if (appointmentId && !appointment) return { status: 404, message: 'Appointment not found' };

  if (appointmentId && !sameReference(appointment.patient, patientId)) {
    return { status: 400, message: 'Appointment patient does not match invoice patient' };
  }

  if (appointmentId && doctorId && !sameReference(appointment.doctor, doctorId)) {
    return { status: 400, message: 'Appointment doctor does not match invoice doctor' };
  }

  return null;
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await populateInvoice(Invoice.find().sort({ createdAt: -1 }));
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve invoices' });
  }
};

const getInvoiceById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
  try {
    const invoice = await populateInvoice(Invoice.findById(req.params.id));
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve invoice' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const payload = pickInvoiceFields(req.body);
    const referenceError = await validateReferences(payload.patient, payload.doctor, payload.appointment);
    if (referenceError) return res.status(referenceError.status).json({ success: false, message: referenceError.message });

    const financials = calculateFinancials(payload);
    const invoice = await Invoice.create({
      ...payload,
      ...financials,
      invoiceNumber: createInvoiceNumber(),
    });
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (error.name === 'InputError' || error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to create invoice' });
  }
};

const updateInvoice = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
  try {
    const existingInvoice = await Invoice.findById(req.params.id);
    if (!existingInvoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const payload = pickInvoiceFields(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No invoice fields provided for update' });
    }

    const patientId = payload.patient ?? existingInvoice.patient;
    const doctorId = Object.hasOwn(payload, 'doctor') ? payload.doctor || null : existingInvoice.doctor;
    const appointmentId = Object.hasOwn(payload, 'appointment') ? payload.appointment || null : existingInvoice.appointment;
    const referenceError = await validateReferences(patientId, doctorId, appointmentId);
    if (referenceError) return res.status(referenceError.status).json({ success: false, message: referenceError.message });

    const financials = calculateFinancials({
      items: payload.items ?? existingInvoice.items,
      discount: payload.discount ?? existingInvoice.discount,
      tax: payload.tax ?? existingInvoice.tax,
      paidAmount: payload.paidAmount ?? existingInvoice.paidAmount,
    });
    const invoice = await populateInvoice(Invoice.findByIdAndUpdate(req.params.id, {
      ...payload,
      doctor: doctorId,
      appointment: appointmentId,
      ...financials,
    }, { new: true, runValidators: true }));

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error.name === 'InputError' || error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to update invoice' });
  }
};

const deleteInvoice = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete invoice' });
  }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice };
