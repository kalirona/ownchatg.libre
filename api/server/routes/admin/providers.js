const express = require('express');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/ProviderAdminController');

const router = express.Router();
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

router.use(requireJwtAuth, requireAdminAccess);

router.get('/overview', ctrl.getOverview);

router.get('/providers', ctrl.listProviders);
router.get('/providers/:id', ctrl.getProvider);
router.post('/providers', ctrl.createProvider);
router.put('/providers/:id', ctrl.updateProvider);
router.delete('/providers/:id', ctrl.deleteProvider);

router.get('/providers/:id/keys', ctrl.listKeys);
router.post('/providers/:id/keys', ctrl.createKey);
router.post('/keys/:keyId/test', ctrl.testKey);
router.delete('/keys/:keyId', ctrl.deleteKey);

router.get('/providers/:id/models', ctrl.listModels);
router.post('/providers/:id/models', ctrl.createModel);
router.put('/models/:modelId', ctrl.updateModel);
router.delete('/models/:modelId', ctrl.deleteModel);

router.get('/rules', ctrl.listRoutingRules);
router.post('/rules', ctrl.createRoutingRule);
router.put('/rules/:id', ctrl.updateRoutingRule);
router.delete('/rules/:id', ctrl.deleteRoutingRule);

router.get('/usage', ctrl.getUsage);
router.get('/costs', ctrl.getCosts);
router.get('/providers/:id/health', ctrl.getHealthHistory);

router.get('/defaults', ctrl.getSystemDefaults);
router.put('/defaults', ctrl.upsertSystemDefault);

module.exports = router;
