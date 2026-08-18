const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getOverview, getAppointmentsReport, getBillingReport, getClinicalReport } = require('../controllers/reportController');

const router = express.Router();
router.use(protect);
router.get('/overview', authorizeRoles('admin', 'receptionist'), getOverview);
router.get('/appointments', authorizeRoles('admin', 'doctor', 'receptionist'), getAppointmentsReport);
router.get('/billing', authorizeRoles('admin', 'receptionist'), getBillingReport);
router.get('/clinical', authorizeRoles('admin', 'doctor'), getClinicalReport);

module.exports = router;
