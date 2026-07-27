const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const controller = require('~/server/controllers/MarketplaceController');

const router = express.Router();

router.use(requireJwtAuth);

router.get('/prompts', controller.listPrompts);
router.get('/featured', controller.getFeatured);
router.get('/categories', controller.getCategories);
router.get('/favorites', controller.getFavorites);
router.post('/favorites/:groupId', controller.toggleFavorite);

module.exports = router;
