import { Model } from 'mongoose';
import type * as t from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import subscriptionPlanSchema from '~/schema/subscriptionPlan';

export function createSubscriptionPlanModel(mongoose: typeof import('mongoose')): Model<t.ISubscriptionPlan> {
  applyTenantIsolation(subscriptionPlanSchema);
  return mongoose.models.SubscriptionPlan || mongoose.model<t.ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
}
