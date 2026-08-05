const express = require('express');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const mediaController = require('~/server/controllers/MediaController');
const AIRouterService = require('~/server/services/AIRouterService');
const MediaHistory = require('~/server/models/MediaHistory');
const { logger } = require('@librechat/data-schemas');

const router = express.Router();

router.use(requireJwtAuth);
router.use(configMiddleware);

/* ── Media Models ─────────────────────────────── */

router.get('/models{/:type}', async (req, res) => {
  try {
    const type = req.params.type;
    const filter = {};
    if (type && ['image', 'video'].includes(type)) {
      filter.type = type;
    }
    const models = await AIRouterService.listModels();
    res.json(models.filter((m) => !type || m.type === type));
  } catch (error) {
    logger.error('[AdminMedia] list models error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

router.post('/models', async (req, res) => {
  try {
    const model = await AIRouterService.createModel(req.body);
    res.status(201).json(model);
  } catch (error) {
    logger.error('[AdminMedia] create model error:', error);
    res.status(500).json({ error: 'Failed to create model' });
  }
});

router.put('/models/:id', async (req, res) => {
  try {
    const model = await AIRouterService.updateModel(req.params.id, req.body);
    if (!model) { return res.status(404).json({ error: 'Model not found' }); }
    res.json(model);
  } catch (error) {
    logger.error('[AdminMedia] update model error:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

router.delete('/models/:id', async (req, res) => {
  try {
    await AIRouterService.deleteModel(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[AdminMedia] delete model error:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

/* ── Media Routing Rules ───────────────────────── */

router.get('/routing', async (req, res) => {
  try {
    const rules = await AIRouterService.listRoutingRules(req.query.type);
    res.json(rules);
  } catch (error) {
    logger.error('[AdminMedia] list routing rules error:', error);
    res.status(500).json({ error: 'Failed to fetch routing rules' });
  }
});

router.post('/routing', async (req, res) => {
  try {
    const rule = await AIRouterService.createRoutingRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('[AdminMedia] create routing rule error:', error);
    res.status(500).json({ error: 'Failed to create routing rule' });
  }
});

router.put('/routing/:id', async (req, res) => {
  try {
    const rule = await AIRouterService.updateRoutingRule(req.params.id, req.body);
    if (!rule) { return res.status(404).json({ error: 'Routing rule not found' }); }
    res.json(rule);
  } catch (error) {
    logger.error('[AdminMedia] update routing rule error:', error);
    res.status(500).json({ error: 'Failed to update routing rule' });
  }
});

router.delete('/routing/:id', async (req, res) => {
  try {
    await AIRouterService.deleteRoutingRule(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[AdminMedia] delete routing rule error:', error);
    res.status(500).json({ error: 'Failed to delete routing rule' });
  }
});

/* ── Media Analytics ──────────────────────────── */

router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [usage, presetsAgg, stylesAgg] = await Promise.all([
      MediaHistory.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: null,
          totalImageRequests: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } },
          totalVideoRequests: { $sum: { $cond: [{ $eq: ['$type', 'video'] }, 1, 0] } },
          creditsConsumed: { $sum: '$creditsCost' },
          failures: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        }},
      ]),
      MediaHistory.aggregate([
        { $match: { createdAt: { $gte: since }, preset: { $ne: null } } },
        { $group: { _id: '$preset', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      MediaHistory.aggregate([
        { $match: { createdAt: { $gte: since }, style: { $ne: null } } },
        { $group: { _id: '$style', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const u = usage[0] || { totalImageRequests: 0, totalVideoRequests: 0, creditsConsumed: 0, failures: 0 };

    res.json({
      totalImageRequests: u.totalImageRequests,
      totalVideoRequests: u.totalVideoRequests,
      creditsConsumed: u.creditsConsumed,
      providerCost: 0,
      revenue: 0,
      profit: 0,
      failures: u.failures,
      averageGenTimeMs: 0,
      popularPresets: presetsAgg.map((p) => ({ preset: p._id, count: p.count })),
      popularStyles: stylesAgg.map((s) => ({ style: s._id, count: s.count })),
    });
  } catch (error) {
    logger.error('[AdminMedia] analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
