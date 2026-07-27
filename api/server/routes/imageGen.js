const express = require('express');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const controller = require('~/server/controllers/ImageGenController');

const router = express.Router();

router.use(requireJwtAuth);
router.use(configMiddleware);

router.get('/providers', controller.getProviders);
router.post('/generate', controller.generate);
router.get('/history', controller.getHistory);
router.delete('/history/:id', controller.deleteHistoryEntry);
router.patch('/history/:id/favorite', controller.toggleFavorite);

module.exports = router;
