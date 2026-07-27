const { logger } = require('@librechat/data-schemas');
const notificationService = require('~/server/services/NotificationService');

async function getNotifications(req, res) {
  try {
    const { page, limit, unreadOnly, type } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      unreadOnly: unreadOnly === 'true',
      type,
    });
    res.json(result);
  } catch (error) {
    logger.error('[NotificationController] getNotifications', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
}

async function markAsRead(req, res) {
  try {
    await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationController] markAsRead', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
}

async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationController] markAllAsRead', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
}

async function deleteNotification(req, res) {
  try {
    await notificationService.deleteNotification(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationController] deleteNotification', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    logger.error('[NotificationController] getUnreadCount', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
}

async function sendDigest(req, res) {
  try {
    const result = await notificationService.sendDigest(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('[NotificationController] sendDigest', error);
    res.status(500).json({ message: 'Error sending digest' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendDigest,
};
