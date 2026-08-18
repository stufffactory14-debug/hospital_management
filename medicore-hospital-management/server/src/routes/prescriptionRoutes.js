const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPrescriptions)
  .post(authorizeRoles('admin', 'doctor'), createPrescription);

router
  .route('/:id')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPrescriptionById)
  .put(authorizeRoles('admin', 'doctor'), updatePrescription)
  .delete(authorizeRoles('admin'), deletePrescription);

module.exports = router;
