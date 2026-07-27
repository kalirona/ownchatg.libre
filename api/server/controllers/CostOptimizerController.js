const optimizer = require('~/server/services/CostOptimizerService');
const registry = require('~/server/services/CostOptimizerRegistry');
const { logger } = require('@librechat/data-schemas');

const suggest = async (req, res) => {
  try {
    const {
      currentModel,
      currentProvider,
      taskType = 'chat',
      minContext,
      maxCost,
      mode = 'balanced',
      excludeProviders = [],
      preferredProvider = null,
      inputTokens = 0,
      outputTokens = 0,
    } = req.body;

    if (!currentModel || !currentProvider) {
      return res.status(400).json({ status: 'error', message: 'currentModel and currentProvider are required' });
    }

    const result = await optimizer.suggestOptimization({
      currentModel,
      currentProvider,
      taskType,
      minContext,
      maxCost,
      mode,
      excludeProviders,
      preferredProvider,
      inputTokens,
      outputTokens,
      userId: req.user?.id,
    });

    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[CostOptimizerController] suggest error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const apply = async (req, res) => {
  try {
    const {
      currentModel,
      currentProvider,
      taskType = 'chat',
      mode = 'balanced',
      inputTokens = 0,
      outputTokens = 0,
    } = req.body;

    if (!currentModel || !currentProvider) {
      return res.status(400).json({ status: 'error', message: 'currentModel and currentProvider are required' });
    }

    const result = await optimizer.applyOptimization({
      currentModel,
      currentProvider,
      taskType,
      mode,
      inputTokens,
      outputTokens,
      userId: req.user?.id,
      autoApproved: true,
    });

    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[CostOptimizerController] apply error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getSavings = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const groupBy = req.query.groupBy || 'day';
    const result = await optimizer.getSavingsSummary({
      userId: req.query.userId || null,
      days,
      groupBy,
    });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[CostOptimizerController] getSavings error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getRecent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await optimizer.getRecentOptimizations(limit);
    res.json({ status: 'ok', optimizations: logs });
  } catch (err) {
    logger.error('[CostOptimizerController] getRecent error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getModels = (req, res) => {
  try {
    const provider = req.query.provider || null;
    const minContext = parseInt(req.query.minContext) || 0;
    const tier = req.query.tier || null;

    let models = registry.getAllModels();
    if (provider) {
      models = models.filter((m) => m.provider === provider);
    }
    if (minContext > 0) {
      models = models.filter((m) => m.context >= minContext);
    }
    if (tier) {
      models = models.filter((m) => m.tier === tier);
    }

    res.json({ status: 'ok', models });
  } catch (err) {
    logger.error('[CostOptimizerController] getModels error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getProviders = (req, res) => {
  try {
    const providers = registry.getAllProviders().map((key) => {
      const info = registry.getProviderInfo(key);
      return {
        key,
        label: info.provider,
        modelCount: Object.keys(info.models).length,
      };
    });
    res.json({ status: 'ok', providers });
  } catch (err) {
    logger.error('[CostOptimizerController] getProviders error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  suggest,
  apply,
  getSavings,
  getRecent,
  getModels,
  getProviders,
};
