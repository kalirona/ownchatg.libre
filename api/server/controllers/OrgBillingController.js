const { logger } = require('@librechat/data-schemas');
const orgBilling = require('~/server/services/OrgBillingService');

async function getSubscription(req, res) {
  try {
    const sub = await orgBilling.getOrgSubscription(req.params.id, req.user.id);
    res.json({ subscription: sub });
  } catch (error) {
    logger.error('[OrgBillingController] getSubscription', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function getBalance(req, res) {
  try {
    const balance = await orgBilling.getOrgBalance(req.params.id, req.user.id);
    res.json({ balance });
  } catch (error) {
    logger.error('[OrgBillingController] getBalance', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function getTransactions(req, res) {
  try {
    const transactions = await orgBilling.getOrgTransactions(req.params.id, req.user.id, parseInt(req.query.limit) || 50);
    res.json({ transactions });
  } catch (error) {
    logger.error('[OrgBillingController] getTransactions', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function allocateCredits(req, res) {
  try {
    const balance = await orgBilling.allocateCredits(req.params.id, req.user.id, req.body.credits, req.body.description);
    res.json({ balance });
  } catch (error) {
    logger.error('[OrgBillingController] allocateCredits', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function getCreditSummary(req, res) {
  try {
    const summary = await orgBilling.getOrgCreditSummary(req.params.id, req.user.id);
    res.json(summary);
  } catch (error) {
    logger.error('[OrgBillingController] getCreditSummary', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function initializeOrgBilling(req, res) {
  try {
    await orgBilling.initializeOrgBilling(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrgBillingController] initializeOrgBilling', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { getSubscription, getBalance, getTransactions, allocateCredits, getCreditSummary, initializeOrgBilling };
