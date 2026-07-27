const rateLimit = require('express-rate-limit');
const { isEnabled } = require('~/server/utils');
const { getConfigEndpoint } = require('~/server/services/Config');

const getGlobalRateLimitWindowMs = () => {
  const minutes = parseInt(process.env.GLOBAL_LIMIT_WINDOW_MINUTES) || 1;
  return minutes * 60 * 1000;
};

const getGlobalRateLimitMax = () => {
  return parseInt(process.env.GLOBAL_LIMIT_MAX) || 1000;
};

const globalLimiter = rateLimit({
  windowMs: getGlobalRateLimitWindowMs(),
  max: getGlobalRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      type: 'error',
      error: {
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
      },
    });
  },
  skip: (req) => {
    /* Health/metrics endpoints should not count toward the global limit */
    if (req.path === '/health' || req.path === '/livez' || req.path === '/readyz' || req.path === '/metrics' || req.path.startsWith('/api/admin/super/health')) {
      return true;
    }
    return false;
  },
});

module.exports = globalLimiter;
