const express = require('express');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/ProviderHealthController');

const router = express.Router();
router.use(requireJwtAuth, requireCapability(SystemCapabilities.ACCESS_ADMIN));

router.get('/', ctrl.getStatus);
router.post('/check-now', ctrl.checkNow);

module.exports = router;
