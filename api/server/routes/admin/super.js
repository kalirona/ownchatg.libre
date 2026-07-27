const express = require('express');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/AdminController');
const analyticsCtrl = require('~/server/controllers/AnalyticsController');

const router = express.Router();

const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

router.use(requireJwtAuth, requireAdminAccess);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/users/:id', ctrl.getUserDetail);
router.patch('/users/:id/role', ctrl.updateUserRole);
router.post('/credits/adjust', ctrl.adjustCredits);
router.get('/revenue', ctrl.getRevenue);
router.get('/subscriptions', ctrl.getSubscriptions);
router.post('/subscriptions/:id/cancel', ctrl.cancelSubscription);
router.get('/providers', ctrl.getProviders);
router.get('/models', ctrl.getModels);
router.get('/announcements', ctrl.getAnnouncements);
router.post('/announcements', ctrl.createAnnouncement);
router.put('/announcements/:id', ctrl.updateAnnouncement);
router.delete('/announcements/:id', ctrl.deleteAnnouncement);
router.get('/health', ctrl.getSystemHealth);
router.get('/features', ctrl.getFeatureFlags);
router.get('/audit', ctrl.getAuditLogs);
router.get('/analytics', analyticsCtrl.getAnalytics);
router.get('/locked-users', ctrl.getLockedUsers);
router.post('/users/:id/unlock', ctrl.unlockUser);

module.exports = router;
