import { Model } from 'mongoose';
import type { IProviderModel } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import providerModelSchema from '~/schema/providerModel';

export function createProviderModelModel(mongoose: typeof import('mongoose')): Model<IProviderModel> {
  applyTenantIsolation(providerModelSchema);
  return mongoose.models.ProviderModel || mongoose.model<IProviderModel>('ProviderModel', providerModelSchema);
}
