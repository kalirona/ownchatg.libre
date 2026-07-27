const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const NotificationPreference = require('~/server/models/NotificationPreference');

const CHANNELS = ['email', 'inApp', 'push', 'slack', 'discord'];

function defaultChannelPrefs() {
  return { email: true, inApp: true, push: false, slack: false, discord: false };
}

async function getPreferences(userId) {
  try {
    let prefs = await NotificationPreference.findOne({ user: userId }).lean();
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: userId });
      prefs = prefs.toObject();
    }
    return prefs;
  } catch (err) {
    logger.error('[NotificationPreferenceService] getPreferences', err);
    return null;
  }
}

async function updatePreferences(userId, updates) {
  try {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { upsert: true, new: true },
    );
    return prefs;
  } catch (err) {
    logger.error('[NotificationPreferenceService] updatePreferences', err);
    throw err;
  }
}

async function updatePushSubscription(userId, subscription) {
  try {
    await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: { pushSubscription: subscription } },
      { upsert: true },
    );
  } catch (err) {
    logger.error('[NotificationPreferenceService] updatePushSubscription', err);
  }
}

async function removePushSubscription(userId) {
  try {
    await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $unset: { pushSubscription: '' } },
    );
  } catch (err) {
    logger.error('[NotificationPreferenceService] removePushSubscription', err);
  }
}

function isChannelEnabled(prefs, type, channel) {
  if (!prefs) { return channel === 'inApp'; }
  if (prefs.types && prefs.types[type] && prefs.types[type][channel] !== undefined) {
    return prefs.types[type][channel];
  }
  if (prefs.channels && prefs.channels[channel] !== undefined) {
    return prefs.channels[channel];
  }
  return channel === 'inApp';
}

async function getUsersByDigestType(digestType) {
  try {
    return await NotificationPreference.find({ digest: digestType }).populate('user', 'email name').lean();
  } catch (err) {
    logger.error('[NotificationPreferenceService] getUsersByDigestType', err);
    return [];
  }
}

async function updateDigestSent(userId) {
  try {
    await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: { lastDigestSentAt: new Date() } },
    );
  } catch (err) {
    logger.error('[NotificationPreferenceService] updateDigestSent', err);
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
  updatePushSubscription,
  removePushSubscription,
  isChannelEnabled,
  getUsersByDigestType,
  updateDigestSent,
  defaultChannelPrefs,
  CHANNELS,
};
