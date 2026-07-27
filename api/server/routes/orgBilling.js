const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/OrgBillingController');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/org/:id/billing/subscription', ctrl.getSubscription);
router.get('/org/:id/billing/balance', ctrl.getBalance);
router.get('/org/:id/billing/transactions', ctrl.getTransactions);
router.post('/org/:id/billing/credits/allocate', ctrl.allocateCredits);
router.get('/org/:id/billing/summary', ctrl.getCreditSummary);
router.post('/org/:id/billing/initialize', ctrl.initializeOrgBilling);

module.exports = router;
