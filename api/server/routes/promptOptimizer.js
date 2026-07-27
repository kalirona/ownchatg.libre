const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/PromptOptimizerController');

const router = express.Router();

router.use(requireJwtAuth);

router.post('/optimize', ctrl.optimize);
router.post('/batch', ctrl.batchOptimize);
router.get('/modes', ctrl.getModes);

module.exports = router;
