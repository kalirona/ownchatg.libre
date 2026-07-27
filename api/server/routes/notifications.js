const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/NotificationController');
const prefCtrl = require('~/server/controllers/NotificationPreferenceController');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/:id/read', ctrl.markAsRead);
router.patch('/read-all', ctrl.markAllAsRead);
router.delete('/:id', ctrl.deleteNotification);

router.get('/preferences', prefCtrl.getPreferences);
router.put('/preferences', prefCtrl.updatePreferences);
router.post('/preferences/push/subscribe', prefCtrl.subscribePush);
router.post('/preferences/push/unsubscribe', prefCtrl.unsubscribePush);
router.post('/digest/send', ctrl.sendDigest);

module.exports = router;
