const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/IntegrationController');

const router = express.Router();

router.get('/', requireJwtAuth, ctrl.listIntegrations);
router.get('/:provider', requireJwtAuth, ctrl.getIntegration);
router.put('/:provider/config', requireJwtAuth, ctrl.saveIntegrationConfig);
router.delete('/:provider', requireJwtAuth, ctrl.deleteIntegration);

router.get('/oauth/:provider/auth', requireJwtAuth, ctrl.oauthAuthorize);
router.get('/oauth/:provider/callback', ctrl.oauthCallback);
router.get('/oauth/:provider/status', requireJwtAuth, ctrl.oauthStatus);
router.post('/oauth/:provider/disconnect', requireJwtAuth, ctrl.oauthDisconnect);
router.post('/oauth/:provider/refresh', requireJwtAuth, ctrl.oauthRefresh);

router.post('/webhooks/zapier', ctrl.handleZapierWebhook);
router.post('/webhooks/n8n', ctrl.handleN8nWebhook);

module.exports = router;
