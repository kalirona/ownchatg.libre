const webpush = require('web-push');
const { logger } = require('@librechat/data-schemas');
const prefService = require('./NotificationPreferenceService');

function init() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_FROM || 'admin@librechat.local'}`,
      vapidPublicKey,
      vapidPrivateKey,
    );
    return true;
  }
  logger.warn('[PushNotificationService] VAPID keys not configured, push disabled');
  return false;
}

let enabled = init();

async function sendPush(userId, title, body, data) {
  if (!enabled) { return; }
  try {
    const prefs = await prefService.getPreferences(userId);
    if (!prefs?.pushSubscription) { return; }
    if (!prefService.isChannelEnabled(prefs, data?.type || 'system_announcement', 'push')) { return; }

    const payload = JSON.stringify({ title, body, icon: '/favicon.ico', badge: '/favicon.ico', data, timestamp: Date.now() });
    await webpush.sendNotification(prefs.pushSubscription, payload);
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      logger.info('[PushNotificationService] Push subscription expired, removing');
      await prefService.removePushSubscription(userId);
    } else {
      logger.error('[PushNotificationService] sendPush error:', err);
    }
  }
}

async function broadcastToPush(userIds, title, body, data) {
  if (!enabled) { return; }
  for (const userId of userIds) {
    await sendPush(userId, title, body, data).catch(() => {});
  }
}

function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

module.exports = { sendPush, broadcastToPush, getVapidPublicKey, enabled };
