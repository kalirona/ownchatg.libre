const crypto = require('crypto');
const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

function getApiKey() {
  return process.env.LEMON_SQUEEZY_API_KEY;
}

function getStoreId() {
  return process.env.LEMON_SQUEEZY_STORE_ID;
}

function getWebhookSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
}

const lemonSqueezyApi = axios.create({
  baseURL: LEMON_SQUEEZY_API_BASE,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

lemonSqueezyApi.interceptors.request.use((config) => {
  const apiKey = getApiKey();
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

async function createCheckout({ variantId, successUrl, cancelUrl, email, customData }) {
  const storeId = getStoreId();
  if (!storeId) {
    throw new Error('LEMON_SQUEEZY_STORE_ID is not configured');
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email,
          custom: customData,
        },
        product_options: {
          redirect_url: successUrl,
        },
        ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: storeId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: variantId,
          },
        },
      },
    },
  };

  try {
    const response = await lemonSqueezyApi.post('/checkouts', body);
    return response.data;
  } catch (error) {
    logger.error('[LemonSqueezy] createCheckout failed:', error?.response?.data || error.message);
    throw error;
  }
}

function verifyWebhookSignature(rawBody, signature) {
  const secret = getWebhookSecret();
  if (!secret) {
    logger.warn('[LemonSqueezy] Webhook secret not configured, skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');

  try {
    const trusted = crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    return trusted;
  } catch {
    return false;
  }
}

function extractEventData(eventPayload) {
  const { meta, data } = eventPayload;
  return {
    eventName: meta?.event_name,
    eventId: data?.id,
    data,
  };
}

async function getSubscription(subscriptionId) {
  try {
    const response = await lemonSqueezyApi.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    logger.error('[LemonSqueezy] getSubscription failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function cancelSubscription(subscriptionId) {
  try {
    const response = await lemonSqueezyApi.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    logger.error('[LemonSqueezy] cancelSubscription failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function getVariant(variantId) {
  try {
    const response = await lemonSqueezyApi.get(`/variants/${variantId}`);
    return response.data;
  } catch (error) {
    logger.error('[LemonSqueezy] getVariant failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function listVariants() {
  try {
    const response = await lemonSqueezyApi.get('/variants', {
      params: { filter: { store_id: getStoreId() } },
    });
    return response.data;
  } catch (error) {
    logger.error('[LemonSqueezy] listVariants failed:', error?.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createCheckout,
  verifyWebhookSignature,
  extractEventData,
  getSubscription,
  cancelSubscription,
  getVariant,
  listVariants,
};
