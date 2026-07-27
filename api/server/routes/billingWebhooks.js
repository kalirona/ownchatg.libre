const express = require('express');
const router = express.Router();
const controller = require('../controllers/BillingWebhooks');

/* Capture raw body for webhook signature verification */
router.use(
  express.raw({
    type: 'application/json',
    limit: '3mb',
  }),
);

router.use((req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString('utf8');
    try {
      req.body = JSON.parse(req.rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  next();
});

/* Public webhook endpoints — no JWT, signature-verified */
router.post('/lemon-squeezy', controller.processLemonSqueezyWebhook);
router.post('/paypal', controller.processPayPalWebhook);

module.exports = router;
