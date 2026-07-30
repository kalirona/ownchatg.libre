import { Model } from 'mongoose';
import type { ISystemDefaults } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import systemDefaultsSchema from '~/schema/systemDefaults';

export function createSystemDefaultsModel(mongoose: typeof import('mongoose')): Model<ISystemDefaults> {
  applyTenantIsolation(systemDefaultsSchema);
  return mongoose.models.SystemDefaults || mongoose.model<ISystemDefaults>('SystemDefaults', systemDefaultsSchema);
}
