import { Model } from 'mongoose';
import type * as t from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import creditPackSchema from '~/schema/creditPack';

export function createCreditPackModel(mongoose: typeof import('mongoose')): Model<t.ICreditPack> {
  applyTenantIsolation(creditPackSchema);
  return mongoose.models.CreditPack || mongoose.model<t.ICreditPack>('CreditPack', creditPackSchema);
}
