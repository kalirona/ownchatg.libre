const { logger } = require('@librechat/data-schemas');
const loginProtection = require('~/server/services/LoginProtectionService');

/**
 * Pre-authentication middleware that checks if the account is locked.
 * Must run after body-parser (req.body.email available) and before passport auth.
 * Returns 423 Locked if the account is temporarily locked out.
 */
const checkAccountLockout = async (req, res, next) => {
  try {
    const email = req.body?.email;
    if (!email) {
      return next();
    }

    const result = await loginProtection.checkLockout(email);
    if (result.locked) {
      const retryAfterSec = Math.ceil((new Date(result.lockUntil).getTime() - Date.now()) / 1000);
      logger.warn(`[checkAccountLockout] Locked login attempt for ${email}, retry after ${retryAfterSec}s`);
      return res.status(423).json({
        type: 'error',
        error: {
          message: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
          statusCode: 423,
          retryAfter: retryAfterSec,
          lockUntil: result.lockUntil,
        },
      });
    }

    next();
  } catch (err) {
    logger.error('[checkAccountLockout] Error:', err);
    next();
  }
};

module.exports = checkAccountLockout;
