const mongoose = require('mongoose');
const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const Integration = require('~/server/models/Integration');

async function getUserIntegrations(userId) {
  try {
    return await Integration.find({ user: userId }).select('-accessToken -refreshToken').lean();
  } catch (err) {
    logger.error('[IntegrationService] getUserIntegrations', err);
    return [];
  }
}

async function getIntegration(userId, provider) {
  try {
    return await Integration.findOne({ user: userId, provider }).lean();
  } catch (err) {
    logger.error('[IntegrationService] getIntegration', err);
    return null;
  }
}

async function saveIntegration(userId, provider, data) {
  try {
    return await Integration.findOneAndUpdate(
      { user: userId, provider },
      { ...data, user: userId, provider },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    logger.error('[IntegrationService] saveIntegration', err);
    throw err;
  }
}

async function deleteIntegration(userId, provider) {
  try {
    await Integration.findOneAndDelete({ user: userId, provider });
  } catch (err) {
    logger.error('[IntegrationService] deleteIntegration', err);
  }
}

async function postToSlack(webhookUrl, message) {
  try {
    const payload = typeof message === 'string' ? { text: message } : message;
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return true;
  } catch (err) {
    logger.error('[IntegrationService] postToSlack', err);
    return false;
  }
}

async function postToDiscord(webhookUrl, message) {
  try {
    const payload = typeof message === 'string' ? { content: message } : message;
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return true;
  } catch (err) {
    logger.error('[IntegrationService] postToDiscord', err);
    return false;
  }
}

async function sendNotificationToIntegrations(userId, title, body, type, providerFilter) {
  try {
    const providerQuery = providerFilter ? { provider: providerFilter } : { provider: { $in: ['slack', 'discord'] } };
    const integrations = await Integration.find({
      user: userId,
      ...providerQuery,
      enabled: true,
    }).lean();
    for (const integration of integrations) {
      const webhookUrl = integration.config?.webhookUrl;
      if (!webhookUrl) continue;
      const message = { text: `*${title}*\n${body}`, content: `**${title}**\n${body}` };
      if (integration.provider === 'slack') {
        await postToSlack(webhookUrl, message);
      } else if (integration.provider === 'discord') {
        await postToDiscord(webhookUrl, message);
      }
    }
  } catch (err) {
    logger.error('[IntegrationService] sendNotificationToIntegrations', err);
  }
}

async function handleWebhookEvent(provider, event, payload) {
  try {
    logger.info(`[IntegrationService] Webhook event from ${provider}: ${event}`);
    return { received: true, provider, event };
  } catch (err) {
    logger.error('[IntegrationService] handleWebhookEvent', err);
    return { received: false, error: err.message };
  }
}

module.exports = {
  getUserIntegrations,
  getIntegration,
  saveIntegration,
  deleteIntegration,
  postToSlack,
  postToDiscord,
  sendNotificationToIntegrations,
  handleWebhookEvent,
};
