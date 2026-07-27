import { Schema } from 'mongoose';
import type * as t from '~/types';

const subscriptionPlanSchema: Schema<t.ISubscriptionPlan> = new Schema<t.ISubscriptionPlan>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  creditsPerPeriod: {
    type: Number,
    required: true,
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    required: true,
  },
  lemonSqueezyVariantId: {
    type: String,
  },
  payPalPlanId: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
  tenantId: {
    type: String,
    index: true,
  },
});

export default subscriptionPlanSchema;
