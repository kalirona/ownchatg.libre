import { Schema } from 'mongoose';
import type * as t from '~/types';

const creditPackSchema: Schema<t.ICreditPack> = new Schema<t.ICreditPack>({
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
  credits: {
    type: Number,
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

export default creditPackSchema;
