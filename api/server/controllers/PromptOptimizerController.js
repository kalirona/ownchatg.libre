const optimizer = require('~/server/services/PromptOptimizerService');
const { logger } = require('@librechat/data-schemas');

const optimize = async (req, res) => {
  try {
    const { prompt, mode = 'rewrite', additionalContext = '' } = req.body;

    if (!prompt) {
      return res.status(400).json({ status: 'error', message: 'Prompt is required' });
    }

    const result = await optimizer.optimize({ prompt, mode, additionalContext });

    if (result.error) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[PromptOptimizerController] optimize error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const batchOptimize = async (req, res) => {
  try {
    const { prompts, mode = 'rewrite' } = req.body;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Prompts array is required' });
    }

    const result = await optimizer.optimizeBatch({ prompts, mode });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[PromptOptimizerController] batchOptimize error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getModes = (req, res) => {
  res.json({ status: 'ok', modes: optimizer.modes });
};

module.exports = {
  optimize,
  batchOptimize,
  getModes,
};
