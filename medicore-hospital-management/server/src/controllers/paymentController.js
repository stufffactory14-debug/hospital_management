const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const paymentMethods = ['cash', 'card', 'online', 'bank_transfer', 'other'];
const pickPaymentFields = (body) => Object.fromEntries(
  ['amount', 'paymentMethod', 'paidAt', 'reference', 'notes']
    .filter((field) => Object.hasOwn(body, field))
    .map((field) => [field, body[field]])
);
const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const populatePayment = (query) => query.populate('receivedBy', 'name email role');
const serializePayment = (payment) => {
  const data = payment.toObject ? payment.toObject() : { ...payment };
  if (data.receivedBy) delete data.receivedBy.password;
  return data;
};
const errorMessage = (res, error) => {
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.name === 'InputError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: 'Unable to process payment' });
};
const inputError = (message) => Object.assign(new Error(message), { name: 'InputError' });

const getPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
  try {
    const payment = await populatePayment(Payment.findById(req.params.id));
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.status(200).json({ success: true, data: serializePayment(payment) });
  } catch (error) { return errorMessage(res, error); }
};

const getInvoicePayments = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.invoiceId)) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
  try {
    if (!await Invoice.exists({ _id: req.params.invoiceId })) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const payments = await populatePayment(Payment.find({ invoice: req.params.invoiceId }).sort({ paidAt: 1 }));
    return res.status(200).json({ success: true, data: payments.map(serializePayment) });
  } catch (error) { return errorMessage(res, error); }
};

const createPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.invoice)) return res.status(400).json({ success: false, message: 'Valid invoice is required' });
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
  if (!paymentMethods.includes(req.body.paymentMethod)) return res.status(400).json({ success: false, message: 'Invalid payment method' });

  const session = await mongoose.startSession();
  try {
    let createdPayment;
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(req.body.invoice).session(session);
      if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });
      const paymentTotals = await Payment.aggregate([
        { $match: { invoice: invoice._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).session(session);
      const recordedPayments = Number(paymentTotals[0]?.total || 0);
      const currentPaid = recordedPayments > 0 ? recordedPayments : Number(invoice.paidAmount || 0);
      const remaining = roundCurrency(Number(invoice.total) - currentPaid);
      if (amount > remaining) throw Object.assign(new Error('Payment amount cannot exceed the remaining invoice balance'), { status: 409 });
      const nextPaid = roundCurrency(currentPaid + amount);
      const payment = new Payment({ ...pickPaymentFields(req.body), invoice: invoice._id, amount: roundCurrency(amount), receivedBy: req.user._id });
      await payment.save({ session });
      invoice.paidAmount = nextPaid;
      invoice.paymentStatus = nextPaid === 0 ? 'unpaid' : nextPaid < Number(invoice.total) ? 'partial' : 'paid';
      invoice.updatedBy = req.user._id;
      await invoice.save({ session });
      createdPayment = payment;
    });
    await createdPayment.populate('receivedBy', 'name email role');
    return res.status(201).json({ success: true, data: serializePayment(createdPayment) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    if ([20, 112, 251].includes(error.code) || /transaction|replica set/i.test(error.message || '')) {
      return res.status(503).json({ success: false, message: 'Payment processing requires MongoDB transaction support' });
    }
    return errorMessage(res, error);
  } finally { await session.endSession(); }
};

module.exports = { createPayment, getPayment, getInvoicePayments };
