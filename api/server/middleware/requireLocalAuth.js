const passport = require('passport');
const { logger } = require('@librechat/data-schemas');
const loginProtection = require('~/server/services/LoginProtectionService');

const requireLocalAuth = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      logger.error('[requireLocalAuth] Error at passport.authenticate:', err);
      return next(err);
    }
    if (!user) {
      logger.debug('[requireLocalAuth] Error: No user');

      /* Track failed attempt */
      const email = req.body?.email;
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      if (email) {
        try {
          const result = await loginProtection.recordFailedAttempt(email, ip, {
            requestId: req.headers['x-request-id'],
            userAgent: req.headers['user-agent'],
          });
          if (result.delayMs > 0) {
            /* Apply progressive delay before responding */
            await new Promise((resolve) => setTimeout(resolve, result.delayMs));
          }
        } catch (trackErr) {
          logger.warn('[requireLocalAuth] Failed to record login attempt:', trackErr.message);
        }
      }

      return res.status(404).send(info);
    }
    if (info && info.message) {
      logger.debug('[requireLocalAuth] Error: ' + info.message);
      return res.status(422).send({ message: info.message });
    }

    /* Track successful login */
    try {
      const email = req.body?.email || user.email;
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      await loginProtection.recordSuccessfulLogin(user._id, email, ip, {
        requestId: req.headers['x-request-id'],
        userAgent: req.headers['user-agent'],
      });
    } catch (trackErr) {
      logger.warn('[requireLocalAuth] Failed to record successful login:', trackErr.message);
    }

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = requireLocalAuth;
