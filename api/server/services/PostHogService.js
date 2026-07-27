const { logger } = require('@librechat/data-schemas');

let PostHog = null;
let client = null;
let initialized = false;

function init() {
  if (initialized) {
    return;
  }

  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) {
    logger.info('[PostHog] POSTHOG_API_KEY not set, skipping initialization');
    return;
  }

  try {
    const { PostHog: PostHogNode } = require('posthog-node');
    client = new PostHogNode(apiKey, {
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: parseInt(process.env.POSTHOG_FLUSH_AT) || 20,
      flushInterval: parseInt(process.env.POSTHOG_FLUSH_INTERVAL) || 10000,
    });
    PostHog = PostHogNode;
    initialized = true;
    logger.info('[PostHog] Initialized successfully');
  } catch (err) {
    logger.warn('[PostHog] Failed to initialize:', err.message);
  }
}

function capture({ distinctId, event, properties = {}, timestamp } = {}) {
  if (!initialized || !client) {
    return;
  }
  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        environment: process.env.NODE_ENV || 'development',
        app_version: process.env.npm_package_version || 'v0.8.7',
      },
      timestamp,
    });
  } catch (err) {
    logger.warn('[PostHog] Capture failed:', err.message);
  }
}

async function flush() {
  if (!initialized || !client) {
    return;
  }
  try {
    await client.flush();
  } catch (err) {
    logger.warn('[PostHog] Flush failed:', err.message);
  }
}

function identify({ distinctId, properties = {} } = {}) {
  if (!initialized || !client) {
    return;
  }
  try {
    client.identify({
      distinctId,
      properties: {
        ...properties,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (err) {
    logger.warn('[PostHog] Identify failed:', err.message);
  }
}

async function getFeatureFlag(key, distinctId, defaultValue = false) {
  if (!initialized || !client) {
    return defaultValue;
  }
  try {
    return await client.getFeatureFlag(key, distinctId);
  } catch (err) {
    logger.warn('[PostHog] getFeatureFlag failed:', err.message);
    return defaultValue;
  }
}

async function isFeatureEnabled(key, distinctId, defaultValue = false) {
  const flag = await getFeatureFlag(key, distinctId, defaultValue);
  return flag === true || flag === String(true);
}

function shutdown() {
  if (!initialized || !client) {
    return;
  }
  try {
    client.shutdown();
    initialized = false;
    client = null;
  } catch (err) {
    logger.warn('[PostHog] Shutdown failed:', err.message);
  }
}

function getClient() {
  return client;
}

function isEnabled() {
  return initialized;
}

module.exports = {
  init,
  capture,
  flush,
  identify,
  getFeatureFlag,
  isFeatureEnabled,
  shutdown,
  getClient,
  isEnabled,
};
