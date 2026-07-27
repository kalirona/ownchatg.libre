const providerHealth = require('~/server/services/ProviderHealthService');
const { logger } = require('@librechat/data-schemas');

const getStatus = (req, res) => {
  try {
    const results = providerHealth.getCachedResults();
    const overall = results.every((r) => r.status === 'healthy') ? 'healthy'
      : results.some((r) => r.status === 'unhealthy') ? 'unhealthy'
      : 'degraded';

    res.json({
      status: overall,
      providers: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[ProviderHealthController] getStatus error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const checkNow = async (req, res) => {
  try {
    const results = await providerHealth.runCheck();
    const overall = results.every((r) => r.status === 'healthy') ? 'healthy'
      : results.some((r) => r.status === 'unhealthy') ? 'unhealthy'
      : 'degraded';

    res.json({
      status: overall,
      providers: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[ProviderHealthController] checkNow error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getStatus,
  checkNow,
};
