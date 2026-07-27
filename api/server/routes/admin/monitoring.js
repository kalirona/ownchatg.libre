const express = require('express');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/MonitoringController');

const router = express.Router();

router.use(requireJwtAuth, requireCapability(SystemCapabilities.ACCESS_ADMIN));

router.get('/', ctrl.getStatus);
router.post('/check-now', ctrl.checkNow);
router.post('/backup', ctrl.triggerBackup);
router.get('/backups', ctrl.listBackups);

module.exports = router;
