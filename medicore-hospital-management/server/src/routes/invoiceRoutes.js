const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');

const router = express.Router();

router.use(protect);
router.route('/').get(authorizeRoles('admin', 'receptionist'), getInvoices).post(authorizeRoles('admin', 'receptionist'), createInvoice);
router.route('/:id').get(authorizeRoles('admin', 'receptionist'), getInvoiceById).put(authorizeRoles('admin', 'receptionist'), updateInvoice).delete(authorizeRoles('admin'), deleteInvoice);

module.exports = router;
