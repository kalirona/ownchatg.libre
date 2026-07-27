const { logger } = require('@librechat/data-schemas');
const { getBillingConfig } = require('@librechat/api');
const { lemonSqueezyService, payPalService } = require('~/server/services/Billing');

async function getPlans(req, res) {
  try {
    const methods = req.app.locals.methods || require('~/models');
    const plans = await methods.getActivePlans();
    res.json(plans);
  } catch (error) {
    logger.error('[Billing] getPlans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

async function getCreditPacks(req, res) {
  try {
    const methods = req.app.locals.methods || require('~/models');
    const creditPacks = await methods.getActiveCreditPacks();
    res.json(creditPacks);
  } catch (error) {
    logger.error('[Billing] getCreditPacks error:', error);
    res.status(500).json({ error: 'Failed to fetch credit packs' });
  }
}

async function createCheckout(req, res) {
  const { planId, creditPackId, provider, successPath } = req.body;

  if (!provider || (!planId && !creditPackId)) {
    return res.status(400).json({ error: 'provider and either planId or creditPackId are required' });
  }

  if (planId && creditPackId) {
    return res.status(400).json({ error: 'Provide either planId or creditPackId, not both' });
  }

  try {
    const methods = req.app.locals.methods || require('~/models');

    let variantId;
    let quantity;

    if (planId) {
      const plan = await methods.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      variantId = plan.lemonSqueezyVariantId;
      quantity = 1;
    } else {
      const creditPack = await methods.getCreditPackById(creditPackId);
      if (!creditPack) {
        return res.status(404).json({ error: 'Credit pack not found' });
      }
      variantId = creditPack.lemonSqueezyVariantId;
      quantity = 1;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}${successPath || '/billing/success'}`;
    const cancelUrl = `${baseUrl}/billing`;

    if (provider === 'lemon_squeezy') {
      const checkout = await lemonSqueezyService.createCheckout({
        variantId,
        successUrl,
        cancelUrl,
        email: req.user?.email,
        customData: {
          userId: req.user.id,
          ...(planId ? { planId } : { creditPackId }),
        },
      });

      const url = checkout?.data?.attributes?.url;
      if (!url) {
        throw new Error('No checkout URL returned from LemonSqueezy');
      }

      return res.json({ url });
    }

    if (provider === 'paypal') {
      if (!planId) {
        return res.status(400).json({ error: 'PayPal only supports subscriptions (planId required)' });
      }

      const plan = await methods.getPlanById(planId);
      if (!plan || !plan.payPalPlanId) {
        return res.status(404).json({ error: 'Plan not found or PayPal not configured for this plan' });
      }

      const subscription = await payPalService.createSubscription(
        plan.payPalPlanId,
        successUrl,
        cancelUrl,
        req.user?.email,
      );

      const approvalUrl = subscription?.links?.find((l) => l.rel === 'approve')?.href;
      if (!approvalUrl) {
        throw new Error('No approval URL returned from PayPal');
      }

      return res.json({ url: approvalUrl });
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (error) {
    logger.error('[Billing] createCheckout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}

async function createPortal(req, res) {
  const billingConfig = getBillingConfig();
  if (!billingConfig?.enabled) {
    return res.status(400).json({ error: 'Billing not enabled' });
  }

  try {
    const methods = req.app.locals.methods || require('~/models');
    const subscription = await methods.getUserSubscription(req.user.id);

    if (!subscription || !subscription.providerSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (subscription.provider === 'lemon_squeezy') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const customerPortalUrl = `https://app.lemonsqueezy.com/checkout?cart=${subscription.providerSubscriptionId}`;
      return res.json({ url: customerPortalUrl });
    }

    if (subscription.provider === 'paypal') {
      return res.json({
        url: `https://www.paypal.com/myaccount/autopay/connect/${subscription.providerSubscriptionId}`,
      });
    }

    return res.status(400).json({ error: 'Unsupported subscription provider' });
  } catch (error) {
    logger.error('[Billing] createPortal error:', error);
    res.status(500).json({ error: 'Failed to create portal URL' });
  }
}

async function getSubscription(req, res) {
  try {
    const methods = req.app.locals.methods || require('~/models');
    const subscription = await methods.getUserSubscription(req.user.id);
    res.json(subscription);
  } catch (error) {
    logger.error('[Billing] getSubscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

async function cancelSubscription(req, res) {
  try {
    const methods = req.app.locals.methods || require('~/models');
    const subscription = await methods.getUserSubscription(req.user.id);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (subscription.provider === 'lemon_squeezy') {
      await lemonSqueezyService.cancelSubscription(subscription.providerSubscriptionId);
    } else if (subscription.provider === 'paypal') {
      await payPalService.cancelSubscription(subscription.providerSubscriptionId);
    }

    await methods.cancelUserSubscription(subscription._id);
    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    logger.error('[Billing] cancelSubscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

async function getTransactions(req, res) {
  try {
    const methods = req.app.locals.methods || require('~/models');
    const transactions = await methods.getPaymentTransactions(req.user.id);
    res.json(transactions);
  } catch (error) {
    logger.error('[Billing] getTransactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

module.exports = {
  getPlans,
  getCreditPacks,
  createCheckout,
  createPortal,
  getSubscription,
  cancelSubscription,
  getTransactions,
};
