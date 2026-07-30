const express = require('express');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const controller = require('~/server/controllers/MediaController');

const router = express.Router();

router.use(requireJwtAuth);
router.use(configMiddleware);

router.get('/presets', controller.getPresets);
router.get('/credit-costs', controller.getCreditCosts);
router.post('/generate/:type', controller.generate);
router.get('/history', controller.getHistory);
router.delete('/history/:id', controller.deleteHistoryEntry);
router.patch('/history/:id/favorite', controller.toggleFavorite);
router.post('/history/:id/retry', controller.retryGeneration);
router.post('/history/:id/cancel', controller.cancelGeneration);

module.exports = router;
