const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const notificationService = require('./NotificationService');

const CHECK_INTERVAL_MS = parseInt(process.env.MONITORING_INTERVAL_MS) || 5 * 60 * 1000;
const STATUS_CACHE_TTL_MS = 60000;

const statusCache = {
  lastRun: null,
  result: null,
};

let intervalHandle = null;

async function checkMongoDB() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = mongoose.connection.readyState;
  return {
    status: state === 1 ? 'healthy' : 'degraded',
    state: states[state] || 'unknown',
    detail: state === 1 ? `Database: ${mongoose.connection.db?.databaseName || 'unknown'}` : undefined,
  };
}

async function checkRedis() {
  let ioredisClient;
  try {
    ioredisClient = require('@librechat/api').ioredisClient;
  } catch (e) {
    return { status: 'unknown', detail: '@librechat/api not available' };
  }
  if (!ioredisClient) {
    return { status: 'unknown', detail: 'Redis not configured' };
  }
  try {
    const pong = await ioredisClient.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'degraded', detail: `ping: ${pong}` };
  } catch (err) {
    return { status: 'unhealthy', detail: err.message };
  }
}

async function checkMeiliSearch() {
  const meiliHost = process.env.MEILI_HOST || 'http://localhost:7700';
  const meiliKey = process.env.MEILI_MASTER_KEY || process.env.MEILI_SERVER_KEY;
  try {
    const http = require('http');
    const https = require('https');
    const lib = meiliHost.startsWith('https') ? https : http;
    const urlObj = new URL(meiliHost);
    const resp = await new Promise((resolve, reject) => {
      const req = lib.get(
        urlObj.origin === meiliHost ? `${meiliHost}/health` : `${meiliHost}/health`,
        { headers: meiliKey ? { Authorization: `Bearer ${meiliKey}` } : {}, timeout: 5000 },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        },
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    if (resp.statusCode === 200) {
      return { status: 'healthy', detail: `HTTP ${resp.statusCode}` };
    }
    return { status: 'degraded', detail: `HTTP ${resp.statusCode}` };
  } catch (err) {
    return { status: 'unhealthy', detail: err.message };
  }
}

async function checkDiskSpace() {
  try {
    const df = require('child_process').execSync('df -k . 2>/dev/null | tail -1', { timeout: 5000, encoding: 'utf8' });
    const parts = df.trim().split(/\s+/);
    if (parts.length >= 5) {
      const usedPercent = parseInt(parts[4].replace('%', ''));
      return {
        status: usedPercent < 90 ? 'healthy' : usedPercent < 95 ? 'degraded' : 'unhealthy',
        detail: `${usedPercent}% used (${parts[2]} / ${parts[1]} KB)`,
      };
    }
    return { status: 'unknown', detail: 'Could not parse df output' };
  } catch (err) {
    return { status: 'unknown', detail: err.message };
  }
}

async function checkMemory() {
  try {
    const usage = process.memoryUsage();
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const status = heapMB < 1024 ? 'healthy' : heapMB < 2048 ? 'degraded' : 'unhealthy';
    return {
      status,
      detail: `RSS: ${rssMB}MB, Heap: ${heapMB}/${heapTotalMB}MB`,
    };
  } catch (err) {
    return { status: 'unknown', detail: err.message };
  }
}

async function runAllChecks() {
  const results = {
    mongodb: await checkMongoDB(),
    memory: await checkMemory(),
    server: { status: 'healthy', detail: `uptime: ${Math.floor(process.uptime())}s` },
  };
  results.redis = await checkRedis();
  results.meilisearch = await checkMeiliSearch();
  results.disk = await checkDiskSpace();

  const unhealthy = Object.entries(results).filter(([, v]) => v.status === 'unhealthy');
  const degraded = Object.entries(results).filter(([, v]) => v.status === 'degraded');

  const overall = unhealthy.length > 0 ? 'unhealthy' : degraded.length > 0 ? 'degraded' : 'healthy';
  const timestamp = new Date().toISOString();

  const result = { status: overall, checks: results, timestamp };
  statusCache.lastRun = Date.now();
  statusCache.result = result;

  return result;
}

async function runHealthCheck() {
  try {
    const result = await runAllChecks();

    if (result.status !== 'healthy') {
      const failed = Object.entries(result.checks)
        .filter(([, v]) => v.status !== 'healthy')
        .map(([name, v]) => `${name}: ${v.status} — ${v.detail || ''}`);

      logger.warn('[Monitoring] Health check degraded:', failed.join('; '));

      try {
        await notificationService.createNotification({
          userId: null,
          type: 'system_alert',
          title: 'System Health Alert',
          body: `Health check status: ${result.status}\nIssues: ${failed.join('\n')}`,
          data: { checkResult: result },
          sendEmail: true,
        });
      } catch (notifErr) {
        logger.error('[Monitoring] Failed to send alert notification:', notifErr);
      }
    }

    return result;
  } catch (err) {
    logger.error('[Monitoring] Health check failed:', err);
    const result = { status: 'unhealthy', error: err.message, timestamp: new Date().toISOString() };
    statusCache.lastRun = Date.now();
    statusCache.result = result;
    return result;
  }
}

function startPeriodicChecks() {
  if (intervalHandle) {
    return;
  }
  logger.info(`[Monitoring] Starting periodic health checks every ${CHECK_INTERVAL_MS / 1000}s`);
  runHealthCheck();
  intervalHandle = setInterval(runHealthCheck, CHECK_INTERVAL_MS);
}

function stopPeriodicChecks() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('[Monitoring] Periodic health checks stopped');
  }
}

function getCachedStatus() {
  if (statusCache.result && statusCache.lastRun && (Date.now() - statusCache.lastRun) < STATUS_CACHE_TTL_MS) {
    return statusCache.result;
  }
  return null;
}

module.exports = {
  runHealthCheck,
  startPeriodicChecks,
  stopPeriodicChecks,
  getCachedStatus,
  checkMongoDB,
  checkRedis,
  checkMeiliSearch,
  checkDiskSpace,
  checkMemory,
};
