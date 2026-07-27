const { logger } = require('@librechat/data-schemas');
const prefService = require('~/server/services/NotificationPreferenceService');

async function getPreferences(req, res) {
  try {
    const prefs = await prefService.getPreferences(req.user.id);
    res.json({ preferences: prefs });
  } catch (error) {
    logger.error('[NotificationPreferenceController] getPreferences', error);
    res.status(500).json({ message: 'Error fetching preferences' });
  }
}

async function updatePreferences(req, res) {
  try {
    const prefs = await prefService.updatePreferences(req.user.id, req.body);
    res.json({ preferences: prefs });
  } catch (error) {
    logger.error('[NotificationPreferenceController] updatePreferences', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
}

async function subscribePush(req, res) {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }
    await prefService.updatePushSubscription(req.user.id, subscription);
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationPreferenceController] subscribePush', error);
    res.status(500).json({ message: 'Error saving push subscription' });
  }
}

async function unsubscribePush(req, res) {
  try {
    await prefService.removePushSubscription(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationPreferenceController] unsubscribePush', error);
    res.status(500).json({ message: 'Error removing push subscription' });
  }
}

module.exports = { getPreferences, updatePreferences, subscribePush, unsubscribePush };
