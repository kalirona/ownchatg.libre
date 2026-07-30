import { Model } from 'mongoose';
import type { IProviderUsage } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import providerUsageSchema from '~/schema/providerUsage';

export function createProviderUsageModel(mongoose: typeof import('mongoose')): Model<IProviderUsage> {
  applyTenantIsolation(providerUsageSchema);
  return mongoose.models.ProviderUsage || mongoose.model<IProviderUsage>('ProviderUsage', providerUsageSchema);
}
