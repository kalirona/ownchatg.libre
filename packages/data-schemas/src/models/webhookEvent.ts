import { Model } from 'mongoose';
import type * as t from '~/types';
import webhookEventSchema from '~/schema/webhookEvent';

export function createWebhookEventModel(mongoose: typeof import('mongoose')): Model<t.IWebhookEvent> {
  return mongoose.models.WebhookEvent || mongoose.model<t.IWebhookEvent>('WebhookEvent', webhookEventSchema);
}
