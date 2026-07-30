import { Model } from 'mongoose';
import type { IRoutingRule } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import routingRuleSchema from '~/schema/routingRule';

export function createRoutingRuleModel(mongoose: typeof import('mongoose')): Model<IRoutingRule> {
  applyTenantIsolation(routingRuleSchema);
  return mongoose.models.RoutingRule || mongoose.model<IRoutingRule>('RoutingRule', routingRuleSchema);
}
