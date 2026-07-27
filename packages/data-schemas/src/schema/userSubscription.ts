import { Schema } from 'mongoose';
import type * as t from '~/types';

const userSubscriptionSchema: Schema<t.IUserSubscription> = new Schema<t.IUserSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['lemon_squeezy', 'paypal'],
      required: true,
    },
    providerSubscriptionId: {
      type: String,
      index: true,
    },
    providerCustomerId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'incomplete', 'expired'],
      default: 'incomplete',
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    creditsAwardedThisPeriod: {
      type: Number,
      default: 0,
    },
    tenantId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default userSubscriptionSchema;
