const { logger } = require('@librechat/data-schemas');

let registered = false;
let queueWaitingGauge = null;
let queueActiveGauge = null;
let queueCompletedGauge = null;
let queueFailedGauge = null;
let queueDelayedGauge = null;
let queuePausedGauge = null;
let providerHealthGauge = null;

function registerMetrics() {
  if (registered) {
    return;
  }

  try {
    const client = require('prom-client');
    const register = client.register;

    if (register.getSingleMetric('queue_jobs_waiting')) {
      registered = true;
      return;
    }

    queueWaitingGauge = new client.Gauge({
      name: 'queue_jobs_waiting',
      help: 'Number of waiting jobs in queue',
      labelNames: ['queue_name'],
      registers: [register],
    });

    queueActiveGauge = new client.Gauge({
      name: 'queue_jobs_active',
      help: 'Number of active jobs in queue',
      labelNames: ['queue_name'],
      registers: [register],
    });

    queueCompletedGauge = new client.Gauge({
      name: 'queue_jobs_completed',
      help: 'Number of completed jobs in queue',
      labelNames: ['queue_name'],
      registers: [register],
    });

    queueFailedGauge = new client.Gauge({
      name: 'queue_jobs_failed',
      help: 'Number of failed jobs in queue',
      labelNames: ['queue_name'],
      registers: [register],
    });

    queueDelayedGauge = new client.Gauge({
      name: 'queue_jobs_delayed',
      help: 'Number of delayed jobs in queue',
      labelNames: ['queue_name'],
      registers: [register],
    });

    queuePausedGauge = new client.Gauge({
      name: 'queue_jobs_paused',
      help: 'Number of paused job groups',
      labelNames: ['queue_name'],
      registers: [register],
    });

    providerHealthGauge = new client.Gauge({
      name: 'provider_health_status',
      help: 'Provider health status (1=healthy, 0=unhealthy)',
      labelNames: ['provider'],
      registers: [register],
    });

    registered = true;
    logger.info('[MetricsHelper] Queue and provider metrics registered');
  } catch (err) {
    logger.debug('[MetricsHelper] Could not register metrics:', err.message);
  }
}

function recordQueueMetrics(queueName, counts) {
  if (!registered) {
    registerMetrics();
  }
  if (!queueWaitingGauge) {
    return;
  }
  try {
    queueWaitingGauge.set({ queue_name: queueName }, counts.waiting || 0);
    queueActiveGauge.set({ queue_name: queueName }, counts.active || 0);
    queueCompletedGauge.set({ queue_name: queueName }, counts.completed || 0);
    queueFailedGauge.set({ queue_name: queueName }, counts.failed || 0);
    queueDelayedGauge.set({ queue_name: queueName }, counts.delayed || 0);
    queuePausedGauge.set({ queue_name: queueName }, counts.paused || 0);
  } catch (err) {
    logger.debug('[MetricsHelper] recordQueueMetrics error:', err.message);
  }
}

function recordProviderHealth(providerName, healthy) {
  if (!registered) {
    registerMetrics();
  }
  if (!providerHealthGauge) {
    return;
  }
  try {
    providerHealthGauge.set({ provider: providerName }, healthy ? 1 : 0);
  } catch (err) {
    logger.debug('[MetricsHelper] recordProviderHealth error:', err.message);
  }
}

module.exports = {
  registerMetrics,
  recordQueueMetrics,
  recordProviderHealth,
};
