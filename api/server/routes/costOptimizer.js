const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/CostOptimizerController');

const router = express.Router();

router.use(requireJwtAuth);

router.post('/suggest', ctrl.suggest);
router.post('/apply', ctrl.apply);
router.get('/savings', ctrl.getSavings);
router.get('/recent', ctrl.getRecent);
router.get('/models', ctrl.getModels);
router.get('/providers', ctrl.getProviders);

module.exports = router;
