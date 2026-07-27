const { logger } = require('@librechat/data-schemas');
const { lemonSqueezyService, payPalService } = require('~/server/services/Billing');

async function processLemonSqueezyWebhook(req, res) {
  const signature = req.headers['x-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!lemonSqueezyService.verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const methods = req.app.locals.methods || require('~/models');
  const event = lemonSqueezyService.extractEventData(req.body);
  const { eventName, eventId } = event;

  if (!eventId || !eventName) {
    return res.status(400).json({ error: 'Invalid webhook event' });
  }

  const existing = await methods.findWebhookEvent(eventId);
  if (existing) {
    return res.status(200).json({ received: true, idempotent: true });
  }

  await methods.createWebhookEvent({
    provider: 'lemon_squeezy',
    eventId,
    eventType: eventName,
    rawBody: req.body,
  });

  try {
    switch (eventName) {
      case 'order_created':
        await handleLemonSqueezyOrderCreated(methods, event.data);
        break;
      case 'subscription_created':
        await handleLemonSqueezySubscriptionCreated(methods, event.data);
        break;
      case 'subscription_updated':
        await handleLemonSqueezySubscriptionUpdated(methods, event.data);
        break;
      case 'subscription_cancelled':
        await handleLemonSqueezySubscriptionCancelled(methods, event.data);
        break;
      default:
        logger.info(`[LemonSqueezy] Unhandled event type: ${eventName}`);
    }

    await methods.markWebhookProcessed(eventId);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`[LemonSqueezy] Error processing webhook ${eventName}:`, error);
    await methods.markWebhookProcessed(eventId, error.message);
    res.status(200).json({ received: true, error: error.message });
  }
}

async function processPayPalWebhook(req, res) {
  const headers = req.headers;
  const body = req.body;

  const isValid = await payPalService.verifyWebhookSignature(headers, body);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const methods = req.app.locals.methods || require('~/models');
  const eventType = body?.event_type;
  const eventId = body?.id;

  if (!eventId || !eventType) {
    return res.status(400).json({ error: 'Invalid webhook event' });
  }

  const existing = await methods.findWebhookEvent(eventId);
  if (existing) {
    return res.status(200).json({ received: true, idempotent: true });
  }

  await methods.createWebhookEvent({
    provider: 'paypal',
    eventId,
    eventType,
    rawBody: body,
  });

  try {
    switch (eventType) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalSaleCompleted(methods, body);
        break;
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handlePayPalSubscriptionCreated(methods, body);
        break;
      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handlePayPalSubscriptionUpdated(methods, body);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handlePayPalSubscriptionCancelled(methods, body);
        break;
      default:
        logger.info(`[PayPal] Unhandled event type: ${eventType}`);
    }

    await methods.markWebhookProcessed(eventId);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`[PayPal] Error processing webhook ${eventType}:`, error);
    await methods.markWebhookProcessed(eventId, error.message);
    res.status(200).json({ received: true, error: error.message });
  }
}

async function handleLemonSqueezyOrderCreated(methods, data) {
  const attributes = data?.attributes;
  const userId = attributes?.first_order_item?.product_options?.custom?.userId;
  const creditPackId = attributes?.first_order_item?.product_options?.custom?.creditPackId;
  const variantId = data?.relationships?.variant?.data?.id;

  if (!userId) {
    logger.warn('[LemonSqueezy] No userId in webhook custom data');
    return;
  }

  const amount = parseFloat(attributes?.total || 0);
  const transactionId = data?.id;

  let creditsAwarded = 0;

  if (creditPackId) {
    const creditPack = await methods.getCreditPackById(creditPackId);
    if (creditPack) {
      creditsAwarded = creditPack.credits;
    }
  } else if (variantId) {
    const plans = await methods.getActivePlans();
    const plan = plans.find((p) => p.lemonSqueezyVariantId === variantId);
    if (plan) {
      creditsAwarded = plan.creditsPerPeriod;
    }
  }

  const { addTokenCredits } = require('~/models');
  if (creditsAwarded > 0) {
    await addTokenCredits(userId, creditsAwarded);
  }

  await methods.createPaymentTransaction({
    user: userId,
    type: creditPackId ? 'credit_pack' : 'subscription',
    provider: 'lemon_squeezy',
    providerTransactionId: transactionId,
    amount,
    creditsAwarded,
    status: 'completed',
    metadata: { variantId, creditPackId },
  });
}

async function handleLemonSqueezySubscriptionCreated(methods, data) {
  const attributes = data?.attributes;
  const userId = attributes?.custom?.userId;
  const variantId = data?.relationships?.variant?.data?.id;

  if (!userId) {
    logger.warn('[LemonSqueezy] No userId in subscription custom data');
    return;
  }

  const plans = await methods.getActivePlans();
  const plan = plans.find((p) => p.lemonSqueezyVariantId === variantId);

  await methods.createUserSubscription({
    user: userId,
    planName: plan?.name || 'Unknown Plan',
    provider: 'lemon_squeezy',
    providerSubscriptionId: data?.id,
    status: 'active',
    currentPeriodStart: attributes?.created_at ? new Date(attributes.created_at) : undefined,
    currentPeriodEnd: attributes?.renews_at ? new Date(attributes.renews_at) : undefined,
  });
}

async function handleLemonSqueezySubscriptionUpdated(methods, data) {
  const attributes = data?.attributes;
  const subscriptionId = data?.id;
  const status = attributes?.status;

  const update = {};
  if (status) {
    const statusMap = {
      active: 'active',
      cancelled: 'canceled',
      past_due: 'past_due',
      expired: 'expired',
      on_trial: 'active',
      paused: 'past_due',
    };
    update.status = statusMap[status] || status;
  }
  if (attributes?.renews_at) {
    update.currentPeriodEnd = new Date(attributes.renews_at);
  }

  if (Object.keys(update).length > 0) {
    await methods.updateUserSubscription(
      { providerSubscriptionId: subscriptionId },
      update,
    );
  }
}

async function handleLemonSqueezySubscriptionCancelled(methods, data) {
  const subscriptionId = data?.id;
  await methods.updateUserSubscription(
    { providerSubscriptionId: subscriptionId },
    { status: 'canceled', canceledAt: new Date() },
  );
}

async function handlePayPalSaleCompleted(methods, body) {
  const resource = body?.resource;
  const billingAgreementId = resource?.billing_agreement_id;
  const amount = parseFloat(resource?.amount?.total || resource?.amount?.value || 0);
  const transactionId = resource?.id;

  if (!billingAgreementId) {
    logger.warn('[PayPal] No billing_agreement_id in sale webhook');
    return;
  }

  const subscription = await methods.getUserSubscriptionByProviderId(billingAgreementId);
  if (!subscription) {
    logger.warn('[PayPal] No subscription found for agreement:', billingAgreementId);
    return;
  }

  const plan = (await methods.getActivePlans()).find((p) => p.name === subscription.planName);
  const creditsAwarded = plan?.creditsPerPeriod || 0;

  const { addTokenCredits } = require('~/models');
  if (creditsAwarded > 0) {
    await addTokenCredits(subscription.user, creditsAwarded);
  }

  await methods.createPaymentTransaction({
    user: subscription.user.toString(),
    type: 'subscription',
    provider: 'paypal',
    providerTransactionId: transactionId,
    providerSubscriptionId: billingAgreementId,
    amount,
    creditsAwarded,
    status: 'completed',
  });
}

async function handlePayPalSubscriptionCreated(methods, body) {
  const resource = body?.resource;
  const subscriptionId = resource?.id;
  const customData = resource?.custom_id;
  let userId;
  try {
    const parsed = JSON.parse(customData || '{}');
    userId = parsed.userId;
  } catch {
    logger.warn('[PayPal] Could not parse custom_id from subscription');
  }

  if (!userId) {
    logger.warn('[PayPal] No userId in subscription webhook');
    return;
  }

  const statusMap = {
    APPROVAL_PENDING: 'incomplete',
    APPROVED: 'active',
    ACTIVE: 'active',
    SUSPENDED: 'past_due',
    CANCELLED: 'canceled',
    EXPIRED: 'expired',
  };

  await methods.createUserSubscription({
    user: userId,
    planName: 'PayPal Plan',
    provider: 'paypal',
    providerSubscriptionId: subscriptionId,
    status: statusMap[resource?.status] || 'incomplete',
    currentPeriodStart: resource?.start_time ? new Date(resource.start_time) : undefined,
  });
}

async function handlePayPalSubscriptionUpdated(methods, body) {
  const resource = body?.resource;
  const subscriptionId = resource?.id;
  const status = resource?.status;

  const statusMap = {
    APPROVAL_PENDING: 'incomplete',
    APPROVED: 'active',
    ACTIVE: 'active',
    SUSPENDED: 'past_due',
    CANCELLED: 'canceled',
    EXPIRED: 'expired',
  };

  const update = {};
  if (status) {
    update.status = statusMap[status] || status;
  }
  if (resource?.billing_info?.next_billing_time) {
    update.currentPeriodEnd = new Date(resource.billing_info.next_billing_time);
  }

  if (Object.keys(update).length > 0) {
    await methods.updateUserSubscription(
      { providerSubscriptionId: subscriptionId },
      update,
    );
  }
}

async function handlePayPalSubscriptionCancelled(methods, body) {
  const resource = body?.resource;
  const subscriptionId = resource?.id;
  await methods.updateUserSubscription(
    { providerSubscriptionId: subscriptionId },
    { status: 'canceled', canceledAt: new Date() },
  );
}

module.exports = {
  processLemonSqueezyWebhook,
  processPayPalWebhook,
};
