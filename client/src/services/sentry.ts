import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),
    replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'),
    integrations: [],
    beforeSend(event) {
      if (event.exception) {
        const frames = event.exception.values?.[0]?.stacktrace?.frames;
        if (frames && frames.length > 20) {
          event.exception.values[0].stacktrace.frames = frames.slice(-20);
        }
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message);
  });
}

export function setSentryUser(userId: string, email?: string): void {
  if (!initialized) return;
  Sentry.setUser({ id: userId, email });
}

export function clearSentryUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

export function getSentry() {
  return initialized ? Sentry : null;
}
