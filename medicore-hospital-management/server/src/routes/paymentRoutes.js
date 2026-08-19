const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createPayment, getPayment, getInvoicePayments } = require('../controllers/paymentController');

const paymentRoutes = express.Router();
const invoicePaymentRoutes = express.Router();

paymentRoutes.use(protect, authorizeRoles('admin', 'receptionist'));
paymentRoutes.post('/', createPayment);
paymentRoutes.get('/:id', getPayment);

invoicePaymentRoutes.use(protect, authorizeRoles('admin', 'receptionist'));
invoicePaymentRoutes.get('/:invoiceId/payments', getInvoicePayments);

module.exports = { paymentRoutes, invoicePaymentRoutes };
