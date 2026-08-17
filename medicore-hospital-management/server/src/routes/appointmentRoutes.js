const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getAppointments)
  .post(authorizeRoles('admin', 'doctor', 'receptionist'), createAppointment);

router
  .route('/:id')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getAppointmentById)
  .put(authorizeRoles('admin', 'doctor', 'receptionist'), updateAppointment)
  .delete(authorizeRoles('admin'), deleteAppointment);

module.exports = router;
