import { Model } from 'mongoose';
import type * as t from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import userSubscriptionSchema from '~/schema/userSubscription';

export function createUserSubscriptionModel(mongoose: typeof import('mongoose')): Model<t.IUserSubscription> {
  applyTenantIsolation(userSubscriptionSchema);
  return mongoose.models.UserSubscription || mongoose.model<t.IUserSubscription>('UserSubscription', userSubscriptionSchema);
}
