import type { Document, Types } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  description?: string;
  price: number;
  currency: string;
  creditsPerPeriod: number;
  interval: 'month' | 'year';
  lemonSqueezyVariantId?: string;
  payPalPlanId?: string;
  active: boolean;
  tenantId?: string;
}

export interface ICreditPack extends Document {
  name: string;
  description?: string;
  price: number;
  currency: string;
  credits: number;
  lemonSqueezyVariantId?: string;
  payPalPlanId?: string;
  active: boolean;
  tenantId?: string;
}

export interface IUserSubscription extends Document {
  user: Types.ObjectId;
  planName: string;
  provider: 'lemon_squeezy' | 'paypal';
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'expired';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
  creditsAwardedThisPeriod: number;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}

export interface IPaymentTransaction extends Document {
  user: Types.ObjectId;
  type: 'subscription' | 'credit_pack';
  provider: 'lemon_squeezy' | 'paypal';
  providerTransactionId?: string;
  providerSubscriptionId?: string;
  amount: number;
  currency: string;
  creditsAwarded: number;
  status: 'completed' | 'refunded' | 'failed' | 'pending';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}

export interface IWebhookEvent extends Document {
  provider: 'lemon_squeezy' | 'paypal';
  eventId: string;
  eventType: string;
  status: 'received' | 'processed' | 'failed';
  rawBody?: unknown;
  processedAt?: Date;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
