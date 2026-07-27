const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const registry = require('./CostOptimizerRegistry');
const notificationService = require('./NotificationService');

const OptimizationLog = mongoose.model('OptimizationLog',
  new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    taskType: { type: String, enum: ['chat', 'code', 'reasoning', 'image', 'video', 'embedding', 'agent'], default: 'chat' },
    originalModel: { type: String, required: true },
    originalProvider: { type: String, required: true },
    optimizedModel: { type: String, required: true },
    optimizedProvider: { type: String, required: true },
    originalCost: { type: Number, required: true },
    optimizedCost: { type: Number, required: true },
    savings: { type: Number, required: true },
    savingsPercent: { type: Number, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    mode: { type: String, enum: ['cost', 'speed', 'quality', 'balanced', 'manual'], default: 'balanced' },
    autoApproved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }, { collection: 'optimizationlogs' })
);

OptimizationLog.createIndexes();

function estimateCost(modelEntry, inputTokens, outputTokens) {
  if (!modelEntry) {
    return 0;
  }
  const inputCost = (inputTokens / 1000000) * modelEntry.inputCost;
  const outputCost = (outputTokens / 1000000) * modelEntry.outputCost;
  return inputCost + outputCost;
}

async function logSavings({
  userId = null,
  taskType = 'chat',
  originalModel,
  originalProvider,
  optimizedModel,
  optimizedProvider,
  originalCost,
  optimizedCost,
  inputTokens = 0,
  outputTokens = 0,
  mode = 'balanced',
  autoApproved = true,
} = {}) {
  try {
    const savings = originalCost - optimizedCost;
    const savingsPercent = originalCost > 0 ? Math.round((savings / originalCost) * 100) : 0;

    await OptimizationLog.create({
      userId,
      taskType,
      originalModel,
      originalProvider,
      optimizedModel,
      optimizedProvider,
      originalCost,
      optimizedCost,
      savings,
      savingsPercent,
      inputTokens,
      outputTokens,
      mode,
      autoApproved,
    });

    return { savings, savingsPercent };
  } catch (err) {
    logger.warn('[CostOptimizer] Failed to log savings:', err.message);
    return { savings: 0, savingsPercent: 0 };
  }
}

async function suggestOptimization({
  currentModel,
  currentProvider,
  taskType = 'chat',
  minContext = 0,
  maxCost = Infinity,
  mode = 'balanced',
  excludeProviders = [],
  preferredProvider = null,
  inputTokens = 0,
  outputTokens = 0,
  userId = null,
} = {}) {
  const current = registry.getModelCost(currentProvider, currentModel);
  if (!current) {
    return null;
  }

  const constraintCtx = Math.max(minContext, current.context || 0);
  const constraintCost = Math.min(maxCost, current.totalCostPer1M);

  const best = registry.getBestValueModel({
    minContext: constraintCtx,
    maxCost: constraintCost,
    excludeProviders: [...excludeProviders, currentProvider],
    mode,
  });

  if (!best) {
    return {
      suggestion: null,
      reason: 'No better model found meeting constraints',
      current,
    };
  }

  const currentTotalCost = current.totalCostPer1M;
  const bestTotalCost = best.totalCostPer1M;

  if (bestTotalCost >= currentTotalCost) {
    return {
      suggestion: null,
      reason: 'Current model is already optimal',
      current,
    };
  }

  const savings = currentTotalCost - bestTotalCost;
  const savingsPercent = Math.round((savings / currentTotalCost) * 100);

  return {
    suggestion: best,
    current,
    savings: {
      per1MInput: current.inputCost - best.inputCost,
      per1MOutput: current.outputCost - best.outputCost,
      per1MTotal: savings,
      percent: savingsPercent,
    },
    estimatedCost: {
      current: estimateCost(current, inputTokens, outputTokens),
      optimized: estimateCost(best, inputTokens, outputTokens),
      savings: estimateCost(current, inputTokens, outputTokens) - estimateCost(best, inputTokens, outputTokens),
    },
  };
}

async function applyOptimization({
  currentModel,
  currentProvider,
  taskType = 'chat',
  mode = 'balanced',
  inputTokens = 0,
  outputTokens = 0,
  userId = null,
  autoApproved = true,
} = {}) {
  const suggestion = await suggestOptimization({
    currentModel,
    currentProvider,
    taskType,
    mode,
    inputTokens,
    outputTokens,
    userId,
  });

  if (!suggestion || !suggestion.suggestion) {
    return {
      applied: false,
      originalModel: currentModel,
      originalProvider: currentProvider,
      optimizedModel: currentModel,
      optimizedProvider: currentProvider,
      reason: suggestion?.reason || 'No optimization available',
    };
  }

  await logSavings({
    userId,
    taskType,
    originalModel: currentModel,
    originalProvider: currentProvider,
    optimizedModel: suggestion.suggestion.model,
    optimizedProvider: suggestion.suggestion.provider,
    originalCost: suggestion.estimatedCost.current,
    optimizedCost: suggestion.estimatedCost.optimized,
    inputTokens,
    outputTokens,
    mode,
    autoApproved,
  });

  return {
    applied: true,
    originalModel: currentModel,
    originalProvider: currentProvider,
    optimizedModel: suggestion.suggestion.model,
    optimizedProvider: suggestion.suggestion.provider,
    savings: suggestion.estimatedCost.savings.toFixed(6),
    savingsPercent: suggestion.savings.percent,
  };
}

async function getSavingsSummary({ userId = null, days = 30, groupBy = 'day' } = {}) {
  const matchFilter = {};
  if (userId) {
    matchFilter.userId = new mongoose.Types.ObjectId(userId);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  matchFilter.createdAt = { $gte: since };

  try {
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: groupBy === 'provider' ? '$optimizedProvider'
            : groupBy === 'model' ? '$optimizedModel'
            : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalSavings: { $sum: '$savings' },
          avgSavingsPercent: { $avg: '$savingsPercent' },
          totalOriginalCost: { $sum: '$originalCost' },
          totalOptimizedCost: { $sum: '$optimizedCost' },
        },
      },
      { $sort: { totalSavings: -1 } },
    ];

    const logs = await OptimizationLog.aggregate(pipeline);

    const totals = await OptimizationLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOptimizations: { $sum: 1 },
          totalSavings: { $sum: '$savings' },
          avgSavingsPercent: { $avg: '$savingsPercent' },
          totalOriginalCost: { $sum: '$originalCost' },
          totalOptimizedCost: { $sum: '$optimizedCost' },
        },
      },
    ]);

    return {
      period: `${days}d`,
      totals: totals[0] || { totalOptimizations: 0, totalSavings: 0, avgSavingsPercent: 0, totalOriginalCost: 0, totalOptimizedCost: 0 },
      breakdown: logs,
    };
  } catch (err) {
    logger.error('[CostOptimizer] getSavingsSummary error:', err);
    return {
      period: `${days}d`,
      totals: { totalOptimizations: 0, totalSavings: 0, avgSavingsPercent: 0, totalOriginalCost: 0, totalOptimizedCost: 0 },
      breakdown: [],
    };
  }
}

async function getRecentOptimizations(limit = 50) {
  try {
    return await OptimizationLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (err) {
    logger.error('[CostOptimizer] getRecentOptimizations error:', err);
    return [];
  }
}

module.exports = {
  OptimizationLog,
  suggestOptimization,
  applyOptimization,
  getSavingsSummary,
  getRecentOptimizations,
  logSavings,
};
