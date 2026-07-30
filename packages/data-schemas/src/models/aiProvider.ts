import { Model } from 'mongoose';
import type { IAIProvider } from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import aiProviderSchema from '~/schema/aiProvider';

export function createAIProviderModel(mongoose: typeof import('mongoose')): Model<IAIProvider> {
  applyTenantIsolation(aiProviderSchema);
  return mongoose.models.AIProvider || mongoose.model<IAIProvider>('AIProvider', aiProviderSchema);
}
