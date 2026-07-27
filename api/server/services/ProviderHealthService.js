const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const notificationService = require('./NotificationService');

let healthCache = {};
let intervalHandle = null;

const CHECK_INTERVAL_MS = parseInt(process.env.PROVIDER_HEALTH_CHECK_INTERVAL) || 5 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = parseInt(process.env.PROVIDER_HEALTH_TIMEOUT) || 10000;

function getConfiguredProviders() {
  const providers = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'openai',
      label: 'OpenAI',
      url: 'https://api.openai.com/v1/models',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      healthyIf: (status) => status === 200 || status === 401,
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: 'anthropic',
      label: 'Anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      healthyIf: (status) => status === 400 || status === 401,
    });
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_KEY) {
    providers.push({
      name: 'google',
      label: 'Google AI',
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY || process.env.GOOGLE_KEY}`,
      healthyIf: (status) => status === 200 || status === 403 || status === 429,
    });
  }

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    providers.push({
      name: 'azure',
      label: 'Azure OpenAI',
      url: `${process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, '')}/openai/models?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'}`,
      headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
      healthyIf: (status) => status === 200 || status === 401,
    });
  }

  if (process.env.AWS_BEDROCK_REGION) {
    providers.push({
      name: 'bedrock',
      label: 'AWS Bedrock',
      url: `https://bedrock.${process.env.AWS_BEDROCK_REGION}.amazonaws.com`,
      healthyIf: (status) => status === 200 || status === 403 || status === 400,
    });
  }

  if (process.env.MEILI_HOST) {
    providers.push({
      name: 'meilisearch',
      label: 'MeiliSearch',
      url: `${process.env.MEILI_HOST}/health`,
      headers: process.env.MEILI_MASTER_KEY ? { Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}` } : {},
      healthyIf: (status) => status === 200,
    });
  }

  return providers;
}

async function checkProvider(provider) {
  const start = Date.now();
  try {
    const http = provider.url.startsWith('https') ? require('https') : require('http');
    const urlObj = new URL(provider.url);

    const result = await new Promise((resolve) => {
      const opts = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        headers: provider.headers || {},
        timeout: PROVIDER_TIMEOUT_MS,
        rejectUnauthorized: false,
      };

      const req = http.request(opts, (res) => {
        res.resume();
        resolve({ status: res.statusCode });
      });

      req.on('error', (err) => resolve({ status: 0, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, error: 'timeout' });
      });

      req.end();
    });

    const durationMs = Date.now() - start;
    const healthy = provider.healthyIf(result.status);

    return {
      name: provider.name,
      label: provider.label,
      status: healthy ? 'healthy' : 'degraded',
      httpStatus: result.status,
      durationMs,
      error: result.error || null,
      lastChecked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: provider.name,
      label: provider.label,
      status: 'unhealthy',
      httpStatus: 0,
      durationMs: Date.now() - start,
      error: err.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkAllProviders() {
  const providers = getConfiguredProviders();
  const results = [];

  for (const provider of providers) {
    const result = await checkProvider(provider);
    results.push(result);
    healthCache[provider.name] = result;
  }

  const unhealthy = results.filter((r) => r.status === 'unhealthy');
  const degraded = results.filter((r) => r.status === 'degraded');

  if (unhealthy.length > 0 || degraded.length > 0) {
    const failed = [...unhealthy, ...degraded]
      .map((r) => `${r.label}: ${r.status} (${r.error || `HTTP ${r.httpStatus}`})`);

    logger.warn('[ProviderHealth] Degraded providers:', failed.join('; '));

    try {
      await notificationService.createNotification({
        userId: null,
        type: 'system_alert',
        title: 'Provider Health Alert',
        body: `Provider health check issues:\n${failed.join('\n')}`,
        data: { providerResults: results },
      });
    } catch (notifErr) {
      logger.error('[ProviderHealth] Notification failed:', notifErr);
    }
  }

  return results;
}

async function runCheck() {
  try {
    return await checkAllProviders();
  } catch (err) {
    logger.error('[ProviderHealth] Check all failed:', err);
    return [];
  }
}

function startPeriodicChecks() {
  if (intervalHandle) {
    return;
  }
  logger.info(`[ProviderHealth] Starting periodic checks every ${CHECK_INTERVAL_MS / 1000}s`);
  runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

function stopPeriodicChecks() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('[ProviderHealth] Periodic checks stopped');
  }
}

function getCachedResults() {
  return Object.values(healthCache);
}

function getCachedResult(name) {
  return healthCache[name] || null;
}

module.exports = {
  checkAllProviders,
  runCheck,
  startPeriodicChecks,
  stopPeriodicChecks,
  getCachedResults,
  getCachedResult,
};
