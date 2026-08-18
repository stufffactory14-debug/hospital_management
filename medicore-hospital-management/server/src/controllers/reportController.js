const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');

const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

const inputError = (message) => {
  const error = new Error(message);
  error.name = 'InputError';
  return error;
};

const dateOnly = (value) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw inputError('Dates must use YYYY-MM-DD format');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw inputError('Invalid date');
  }
  return date;
};

const getDateRange = (req) => {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const from = dateOnly(req.query.from) || defaultFrom;
  const inclusiveTo = dateOnly(req.query.to) || defaultTo;
  if (from > inclusiveTo) throw inputError('The from date cannot be after the to date');
  const toExclusive = new Date(inclusiveTo);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  return {
    from,
    toExclusive,
    effectiveFrom: from.toISOString().slice(0, 10),
    effectiveTo: inclusiveTo.toISOString().slice(0, 10),
  };
};

const rangeResponse = (range, data) => ({
  range: { from: range.effectiveFrom, to: range.effectiveTo },
  ...data,
});

const dateMatch = (field, range) => ({ [field]: { $gte: range.from, $lt: range.toExclusive } });

const getOverview = async (req, res) => {
  try {
    const range = getDateRange(req);
    const [patients, doctors, appointments, prescriptions, invoices] = await Promise.all([
      Patient.countDocuments(dateMatch('createdAt', range)),
      Doctor.countDocuments(dateMatch('createdAt', range)),
      Appointment.aggregate([{ $match: dateMatch('dateTime', range) }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Prescription.countDocuments(dateMatch('createdAt', range)),
      Invoice.aggregate([
        { $match: dateMatch('createdAt', range) },
        { $group: { _id: null, count: { $sum: 1 }, totalInvoiced: { $sum: '$total' }, totalPaid: { $sum: '$paidAmount' }, totalOutstanding: { $sum: { $max: [{ $subtract: ['$total', '$paidAmount'] }, 0] } } } },
      ]),
    ]);
    const appointmentCounts = Object.fromEntries(APPOINTMENT_STATUSES.map((status) => [status, appointments.find((item) => item._id === status)?.count || 0]));
    const invoiceTotals = invoices[0] || { count: 0, totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 };
    return res.status(200).json({ success: true, data: rangeResponse(range, {
      totalPatients: patients,
      totalDoctors: doctors,
      totalAppointments: appointments.reduce((sum, item) => sum + item.count, 0),
      scheduledAppointments: appointmentCounts.scheduled,
      completedAppointments: appointmentCounts.completed,
      cancelledAppointments: appointmentCounts.cancelled,
      totalPrescriptions: prescriptions,
      totalInvoices: invoiceTotals.count,
      totalInvoiced: Number(invoiceTotals.totalInvoiced || 0),
      totalPaid: Number(invoiceTotals.totalPaid || 0),
      totalOutstanding: Number(invoiceTotals.totalOutstanding || 0),
    }) });
  } catch (error) {
    if (error.name === 'InputError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Unable to retrieve report overview' });
  }
};

const getAppointmentsReport = async (req, res) => {
  try {
    const range = getDateRange(req);
    const { status, doctor } = req.query;
    if (status && !APPOINTMENT_STATUSES.includes(status)) throw inputError('Invalid appointment status');
    if (doctor && !mongoose.isValidObjectId(doctor)) throw inputError('Invalid doctor ID');
    const match = { ...dateMatch('dateTime', range) };
    if (status) match.status = status;
    if (doctor) match.doctor = new mongoose.Types.ObjectId(doctor);
    const [byStatus, byDate, byDoctor] = await Promise.all([
      Appointment.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Appointment.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateTime', timezone: 'UTC' } }, count: { $sum: 1 } } }, { $project: { _id: 0, date: '$_id', count: 1 } }, { $sort: { date: 1 } }]),
      Appointment.aggregate([{ $match: match }, { $group: { _id: '$doctor', count: { $sum: 1 } } }, { $lookup: { from: Doctor.collection.name, localField: '_id', foreignField: '_id', as: 'doctor' } }, { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, doctorId: '$_id', doctorName: { $ifNull: ['$doctor.name', 'Unknown doctor'] }, count: 1 } }, { $sort: { count: -1, doctorName: 1 } }]),
    ]);
    return res.status(200).json({ success: true, data: rangeResponse(range, { byStatus, byDate, byDoctor }) });
  } catch (error) {
    if (error.name === 'InputError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Unable to retrieve appointment report' });
  }
};

const getBillingReport = async (req, res) => {
  try {
    const range = getDateRange(req);
    const { status } = req.query;
    if (status && !PAYMENT_STATUSES.includes(status)) throw inputError('Invalid payment status');
    const match = { ...dateMatch('createdAt', range) };
    if (status) match.paymentStatus = status;
    const [summary, byStatus, byDate] = await Promise.all([
      Invoice.aggregate([{ $match: match }, { $group: { _id: null, invoiceCount: { $sum: 1 }, totalInvoiced: { $sum: '$total' }, totalPaid: { $sum: '$paidAmount' }, totalOutstanding: { $sum: { $max: [{ $subtract: ['$total', '$paidAmount'] }, 0] } } } }]),
      Invoice.aggregate([{ $match: match }, { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$total' }, paidAmount: { $sum: '$paidAmount' } } }, { $sort: { _id: 1 } }]),
      Invoice.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, invoiceCount: { $sum: 1 }, totalInvoiced: { $sum: '$total' }, totalPaid: { $sum: '$paidAmount' } } }, { $project: { _id: 0, date: '$_id', invoiceCount: 1, totalInvoiced: 1, totalPaid: 1 } }, { $sort: { date: 1 } }]),
    ]);
    const totals = summary[0] || { invoiceCount: 0, totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 };
    return res.status(200).json({ success: true, data: rangeResponse(range, { invoiceCount: totals.invoiceCount, totalInvoiced: Number(totals.totalInvoiced || 0), totalPaid: Number(totals.totalPaid || 0), totalOutstanding: Number(totals.totalOutstanding || 0), byStatus, byDate }) });
  } catch (error) {
    if (error.name === 'InputError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Unable to retrieve billing report' });
  }
};

const getClinicalReport = async (req, res) => {
  try {
    const range = getDateRange(req);
    const match = dateMatch('createdAt', range);
    const [summary, byDate, byDoctor, medicineCount, topMedicines] = await Promise.all([
      Prescription.aggregate([{ $match: match }, { $group: { _id: null, prescriptionCount: { $sum: 1 } } }]),
      Prescription.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } }, { $project: { _id: 0, date: '$_id', count: 1 } }, { $sort: { date: 1 } }]),
      Prescription.aggregate([{ $match: match }, { $group: { _id: '$doctor', count: { $sum: 1 } } }, { $lookup: { from: Doctor.collection.name, localField: '_id', foreignField: '_id', as: 'doctor' } }, { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, doctorId: '$_id', doctorName: { $ifNull: ['$doctor.name', 'Unknown doctor'] }, count: 1 } }, { $sort: { count: -1, doctorName: 1 } }]),
      Prescription.aggregate([{ $match: match }, { $unwind: '$medicines' }, { $group: { _id: null, count: { $sum: 1 } } }]),
      Prescription.aggregate([{ $match: match }, { $unwind: '$medicines' }, { $group: { _id: '$medicines.name', count: { $sum: 1 } } }, { $project: { _id: 0, medicine: '$_id', count: 1 } }, { $sort: { count: -1, medicine: 1 } }, { $limit: 10 }]),
    ]);
    return res.status(200).json({ success: true, data: rangeResponse(range, { prescriptionCount: summary[0]?.prescriptionCount || 0, prescriptionMedicineCount: medicineCount[0]?.count || 0, byDate, byDoctor, topMedicines }) });
  } catch (error) {
    if (error.name === 'InputError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Unable to retrieve clinical report' });
  }
};

module.exports = { getOverview, getAppointmentsReport, getBillingReport, getClinicalReport };
