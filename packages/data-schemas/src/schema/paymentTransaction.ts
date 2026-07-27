import { Schema } from 'mongoose';
import type * as t from '~/types';

const paymentTransactionSchema: Schema<t.IPaymentTransaction> = new Schema<t.IPaymentTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    type: {
      type: String,
      enum: ['subscription', 'credit_pack'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['lemon_squeezy', 'paypal'],
      required: true,
    },
    providerTransactionId: {
      type: String,
      index: true,
    },
    providerSubscriptionId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    creditsAwarded: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'refunded', 'failed', 'pending'],
      default: 'completed',
    },
    metadata: {
      type: Schema.Types.Mixed,
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

export default paymentTransactionSchema;
