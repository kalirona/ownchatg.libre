import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  if (!apiKey) {
    return;
  }

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    loaded: () => {
      initialized = true;
    },
  });
}

export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, {
    ...properties,
    environment: import.meta.env.MODE || 'development',
  });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function resetUser(): void {
  if (!initialized) return;
  posthog.reset();
}

export async function isFeatureEnabled(key: string, defaultValue = false): Promise<boolean> {
  if (!initialized) return defaultValue;
  return posthog.isFeatureEnabled(key) ?? defaultValue;
}

export function getPostHog() {
  return initialized ? posthog : null;
}
