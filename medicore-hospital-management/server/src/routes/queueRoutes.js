const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getQueue, getQueueEntry, updateQueueStatus } = require('../controllers/queueController');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'receptionist', 'doctor'));
router.get('/', getQueue);
router.get('/:id', getQueueEntry);
router.put('/:id/status', updateQueueStatus);

module.exports = router;
