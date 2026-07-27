const queueMonitor = require('~/server/services/QueueMonitorService');
const { logger } = require('@librechat/data-schemas');

const getQueueStatus = (req, res) => {
  try {
    const counts = queueMonitor.getQueueCounts();
    if (!counts) {
      return res.status(503).json({ status: 'error', message: 'Queue service not available' });
    }
    res.json({
      status: 'ok',
      queue: 'workflow-execution',
      counts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[QueueMonitorController] getQueueStatus error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getQueueHistory = (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60;
    const history = queueMonitor.getHistory(minutes);
    res.json({ status: 'ok', history });
  } catch (err) {
    logger.error('[QueueMonitorController] getQueueHistory error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getQueueStatus,
  getQueueHistory,
};
