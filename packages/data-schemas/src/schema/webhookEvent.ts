import { Schema } from 'mongoose';
import type * as t from '~/types';

const webhookEventSchema: Schema<t.IWebhookEvent> = new Schema<t.IWebhookEvent>(
  {
    provider: {
      type: String,
      enum: ['lemon_squeezy', 'paypal'],
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['received', 'processed', 'failed'],
      default: 'received',
    },
    rawBody: {
      type: Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default webhookEventSchema;
