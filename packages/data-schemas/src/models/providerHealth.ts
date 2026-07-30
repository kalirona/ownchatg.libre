import { Model } from 'mongoose';
import type { IProviderHealth } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import providerHealthSchema from '~/schema/providerHealth';

export function createProviderHealthLogModel(mongoose: typeof import('mongoose')): Model<IProviderHealth> {
  applyTenantIsolation(providerHealthSchema);
  return mongoose.models.ProviderHealthLog || mongoose.model<IProviderHealth>('ProviderHealthLog', providerHealthSchema);
}
