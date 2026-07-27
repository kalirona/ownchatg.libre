const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const PAYPAL_API_BASE_SANDBOX = 'https://api-m.sandbox.paypal.com';
const PAYPAL_API_BASE_LIVE = 'https://api-m.paypal.com';

let accessToken = null;
let tokenExpiresAt = null;

function getApiBase() {
  return process.env.PAYPAL_SANDBOX !== 'false'
    ? PAYPAL_API_BASE_SANDBOX
    : PAYPAL_API_BASE_LIVE;
}

async function getAccessToken() {
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or secret not configured');
  }

  try {
    const response = await axios({
      method: 'POST',
      url: `${getApiBase()}/v1/oauth2/token`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: clientId,
        password: clientSecret,
      },
      data: 'grant_type=client_credentials',
    });

    accessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (error) {
    logger.error('[PayPal] getAccessToken failed:', error?.response?.data || error.message);
    throw error;
  }
}

const payPalApi = async () => {
  const token = await getAccessToken();
  const api = axios.create({
    baseURL: getApiBase(),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return api;
};

async function createProduct(name, description) {
  try {
    const api = await payPalApi();
    const response = await api.post('/v1/catalogs/products', {
      name,
      description: description || name,
      type: 'SERVICE',
    });
    return response.data;
  } catch (error) {
    logger.error('[PayPal] createProduct failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function createPlan(productId, name, description, price, interval) {
  try {
    const api = await payPalApi();
    const response = await api.post('/v1/billing/plans', {
      product_id: productId,
      name,
      description: description || name,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval.toUpperCase(),
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    });
    return response.data;
  } catch (error) {
    logger.error('[PayPal] createPlan failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function createSubscription(planId, returnUrl, cancelUrl, email) {
  try {
    const api = await payPalApi();
    const body = {
      plan_id: planId,
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: process.env.APP_TITLE || 'LibreChat',
        locale: 'en-US',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    };
    if (email) {
      body.subscriber = { email_address: email };
    }
    const response = await api.post('/v1/billing/subscriptions', body);
    return response.data;
  } catch (error) {
    logger.error('[PayPal] createSubscription failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function getSubscription(subscriptionId) {
  try {
    const api = await payPalApi();
    const response = await api.get(`/v1/billing/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    logger.error('[PayPal] getSubscription failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function cancelSubscription(subscriptionId, reason) {
  try {
    const api = await payPalApi();
    const response = await api.post(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      reason: reason || 'Customer requested cancellation',
    });
    return response.data;
  } catch (error) {
    logger.error('[PayPal] cancelSubscription failed:', error?.response?.data || error.message);
    throw error;
  }
}

async function verifyWebhookSignature(headers, body) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.warn('[PayPal] Webhook ID not configured, skipping signature verification');
    return true;
  }

  try {
    const api = await payPalApi();
    const verification = await api.post('/v1/notifications/verify-webhook-signature', {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body,
    });
    return verification.data?.verification_status === 'SUCCESS';
  } catch (error) {
    logger.error('[PayPal] verifyWebhookSignature failed:', error?.response?.data || error.message);
    return false;
  }
}

module.exports = {
  createProduct,
  createPlan,
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhookSignature,
  getAccessToken,
};
