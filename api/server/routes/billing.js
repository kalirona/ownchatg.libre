const express = require('express');
const router = express.Router();
const controller = require('../controllers/Billing');
const { requireJwtAuth } = require('../middleware/');

/* Protected routes — require authentication */
router.get('/plans', requireJwtAuth, controller.getPlans);
router.get('/credit-packs', requireJwtAuth, controller.getCreditPacks);
router.post('/create-checkout', requireJwtAuth, controller.createCheckout);
router.post('/create-portal', requireJwtAuth, controller.createPortal);
router.get('/subscription', requireJwtAuth, controller.getSubscription);
router.post('/subscription/cancel', requireJwtAuth, controller.cancelSubscription);
router.get('/transactions', requireJwtAuth, controller.getTransactions);

module.exports = router;
