import { isEnabled } from '~/utils';
import type { TBillingConfig } from 'librechat-data-provider';
import type { AppConfig } from '@librechat/data-schemas';

export function getBillingConfig(appConfig?: AppConfig): Partial<TBillingConfig> {
  const enabled = isEnabled(process.env.BILLING_ENABLED);
  const lemonSqueezyEnabled = isEnabled(process.env.LEMON_SQUEEZY_ENABLED);
  const paypalEnabled = isEnabled(process.env.PAYPAL_ENABLED);

  const config: Partial<TBillingConfig> = {
    enabled,
    lemonSqueezy: lemonSqueezyEnabled
      ? {
          enabled: true,
          apiKey: process.env.LEMON_SQUEEZY_API_KEY,
          storeId: process.env.LEMON_SQUEEZY_STORE_ID,
          webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
        }
      : undefined,
    paypal: paypalEnabled
      ? {
          enabled: true,
          clientId: process.env.PAYPAL_CLIENT_ID,
          clientSecret: process.env.PAYPAL_CLIENT_SECRET,
          webhookId: process.env.PAYPAL_WEBHOOK_ID,
          sandbox: process.env.PAYPAL_SANDBOX !== 'false',
        }
      : undefined,
  };

  if (!appConfig) {
    return config;
  }

  return { ...config, ...(appConfig?.billing ?? {}) };
}
