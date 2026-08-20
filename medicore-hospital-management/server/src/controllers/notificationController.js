const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const owned = (req) => ({ recipient: req.user._id });
const safeNotification = (notification) => {
  const data = notification.toObject ? notification.toObject() : { ...notification };
  delete data.__v;
  return data;
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find(owned(req)).sort({ createdAt: -1 }).limit(30);
    return res.status(200).json({ success: true, data: notifications.map(safeNotification) });
  } catch (error) { return res.status(500).json({ success: false, message: 'Unable to retrieve notifications' }); }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ ...owned(req), read: false });
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) { return res.status(500).json({ success: false, message: 'Unable to retrieve unread notifications' }); }
};

const markRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID' });
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, ...owned(req) }, { $set: { read: true } }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.status(200).json({ success: true, data: safeNotification(notification) });
  } catch (error) { return res.status(500).json({ success: false, message: 'Unable to mark notification as read' }); }
};

const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ ...owned(req), read: false }, { $set: { read: true } });
    return res.status(200).json({ success: true, data: { updated: result.modifiedCount } });
  } catch (error) { return res.status(500).json({ success: false, message: 'Unable to mark notifications as read' }); }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
