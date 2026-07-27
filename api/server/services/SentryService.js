const { logger } = require('@librechat/data-schemas');

let Sentry = null;
let initialized = false;

function init() {
  if (initialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('[Sentry] SENTRY_DSN not set, skipping initialization');
    return;
  }

  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1,
      sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE) || 1.0,
      maxBreadcrumbs: 50,
      debug: false,
      enabled: true,
      integrations: [],
      beforeSend(event) {
        if (event.exception) {
          const frames = event.exception.values?.[0]?.stacktrace?.frames;
          if (frames) {
            event.exception.values[0].stacktrace.frames = frames.slice(-10);
          }
        }
        return event;
      },
    });

    initialized = true;
    logger.info('[Sentry] Initialized successfully');
  } catch (err) {
    logger.warn('[Sentry] Failed to initialize:', err.message);
  }
}

function captureException(error, context = {}) {
  if (!initialized || !Sentry) {
    return;
  }
  Sentry.withScope((scope) => {
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context.tags) {
      scope.setTags(context.tags);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    if (context.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
}

function captureMessage(message, context = {}) {
  if (!initialized || !Sentry) {
    return;
  }
  Sentry.withScope((scope) => {
    if (context.level) {
      scope.setLevel(context.level);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureMessage(message);
  });
}

function setUser(userId, email, username) {
  if (!initialized || !Sentry) {
    return;
  }
  Sentry.setUser({ id: userId, email, username });
}

function unsetUser() {
  if (!initialized || !Sentry) {
    return;
  }
  Sentry.setUser(null);
}

function getRequestHandler() {
  if (!initialized || !Sentry) {
    return (_req, _res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

function getErrorHandler() {
  if (!initialized || !Sentry) {
    return (err, _req, _res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
}

function isEnabled() {
  return initialized;
}

module.exports = {
  init,
  captureException,
  captureMessage,
  setUser,
  unsetUser,
  getRequestHandler,
  getErrorHandler,
  isEnabled,
};
