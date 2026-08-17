const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPatients)
  .post(authorizeRoles('admin', 'receptionist'), createPatient);

router
  .route('/:id')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPatientById)
  .put(authorizeRoles('admin', 'receptionist'), updatePatient)
  .delete(authorizeRoles('admin'), deletePatient);

module.exports = router;
