const { logger } = require('@librechat/data-schemas');
const queueService = require('./WorkflowQueueService');
const { recordQueueMetrics } = require('~/server/utils/metricsHelper');

let pollingHandle = null;
let queueHistory = [];

function getQueueCounts() {
  try {
    const status = queueService.getQueueStatus();
    if (!status) {
      return null;
    }
    return status;
  } catch (err) {
    logger.warn('[QueueMonitor] getQueueCounts failed:', err.message);
    return null;
  }
}

function recordMetrics() {
  try {
    const counts = getQueueCounts();
    if (counts) {
      recordQueueMetrics('workflow-execution', counts);
    }
  } catch (err) {
    logger.debug('[QueueMonitor] recordMetrics error:', err.message);
  }
}

function startPolling(intervalMs = 30000) {
  if (pollingHandle) {
    return;
  }
  logger.info(`[QueueMonitor] Starting queue metrics polling every ${intervalMs / 1000}s`);
  recordMetrics();
  pollingHandle = setInterval(recordMetrics, intervalMs);
}

function stopPolling() {
  if (pollingHandle) {
    clearInterval(pollingHandle);
    pollingHandle = null;
    logger.info('[QueueMonitor] Queue metrics polling stopped');
  }
}

function recordHistory(snapshot) {
  queueHistory.push({
    timestamp: new Date().toISOString(),
    ...snapshot,
  });
  if (queueHistory.length > 1440) {
    queueHistory = queueHistory.slice(-1440);
  }
}

function getHistory(minutes = 60) {
  const since = Date.now() - minutes * 60 * 1000;
  return queueHistory.filter((h) => new Date(h.timestamp).getTime() > since);
}

module.exports = {
  getQueueCounts,
  startPolling,
  stopPolling,
  recordHistory,
  getHistory,
};
