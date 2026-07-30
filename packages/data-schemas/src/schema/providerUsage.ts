import mongoose, { Schema, Document } from 'mongoose';

export interface IProviderUsage extends Document {
  providerId: mongoose.Types.ObjectId;
  modelId?: string;
  date: Date;
  requests: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  errors: number;
  latencyMs: number;
  userId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
}

const providerUsageSchema: Schema<IProviderUsage> = new Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider', required: true },
  modelId: { type: String },
  date: { type: Date, required: true },
  requests: { type: Number, default: 0 },
  tokensInput: { type: Number, default: 0 },
  tokensOutput: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
});

providerUsageSchema.index({ providerId: 1, date: -1 });
providerUsageSchema.index({ date: -1 });
providerUsageSchema.index({ userId: 1, date: -1 });

export default providerUsageSchema;
