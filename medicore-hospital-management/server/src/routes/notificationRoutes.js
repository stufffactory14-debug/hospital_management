const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(protect);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
