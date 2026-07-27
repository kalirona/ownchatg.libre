const express = require('express');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const controller = require('~/server/controllers/VideoGenController');

const router = express.Router();

router.use(requireJwtAuth);
router.use(configMiddleware);

router.get('/providers', controller.getProviders);
router.get('/duration-limits', controller.getDurationLimits);
router.post('/generate', controller.generate);
router.get('/history', controller.getHistory);
router.get('/history/:id/status', controller.getStatus);
router.delete('/history/:id', controller.deleteHistoryEntry);
router.patch('/history/:id/favorite', controller.toggleFavorite);

module.exports = router;
