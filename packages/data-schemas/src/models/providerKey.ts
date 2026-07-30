import { Model } from 'mongoose';
import type { IProviderKey } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import providerKeySchema from '~/schema/providerKey';

export function createProviderKeyModel(mongoose: typeof import('mongoose')): Model<IProviderKey> {
  applyTenantIsolation(providerKeySchema);
  return mongoose.models.ProviderKey || mongoose.model<IProviderKey>('ProviderKey', providerKeySchema);
}
