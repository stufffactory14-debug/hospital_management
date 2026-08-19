const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: [true, 'Invoice is required'] },
    amount: { type: Number, required: [true, 'Payment amount is required'], min: [0.01, 'Payment amount must be greater than zero'] },
    paymentMethod: { type: String, enum: ['cash', 'card', 'online', 'bank_transfer', 'other'], required: [true, 'Payment method is required'] },
    paidAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Payment receiver is required'] },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ invoice: 1, paidAt: 1 });
paymentSchema.index({ receivedBy: 1, paidAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
