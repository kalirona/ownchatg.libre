const { logger } = require('@librechat/data-schemas');

const logDrain = async (req, res) => {
  const token = process.env.BETTER_STACK_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  try {
    const entries = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ status: 'error', message: 'Expected array of log entries' });
    }

    for (const entry of entries) {
      const level = entry.level || 'info';
      const message = entry.message || entry.msg || '(empty)';
      const meta = { ...entry };
      delete meta.level;
      delete meta.message;
      delete meta.msg;

      if (level === 'error' || level === 'critical') {
        logger.error(`[BetterStack] ${message}`, meta);
      } else if (level === 'warn' || level === 'warning') {
        logger.warn(`[BetterStack] ${message}`, meta);
      } else {
        logger.info(`[BetterStack] ${message}`, meta);
      }
    }

    res.json({ status: 'ok', received: entries.length });
  } catch (err) {
    logger.error('[BetterStack] Log drain error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  logDrain,
};
