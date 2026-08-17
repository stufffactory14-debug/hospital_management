const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getDoctors)
  .post(authorizeRoles('admin'), createDoctor);

router
  .route('/:id')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getDoctorById)
  .put(authorizeRoles('admin'), updateDoctor)
  .delete(authorizeRoles('admin'), deleteDoctor);

module.exports = router;
