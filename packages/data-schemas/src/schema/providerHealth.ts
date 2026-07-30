import mongoose, { Schema, Document } from 'mongoose';

export interface IProviderHealth extends Document {
  providerId: mongoose.Types.ObjectId;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorMessage?: string;
  checkedAt: Date;
}

const providerHealthSchema: Schema<IProviderHealth> = new Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider', required: true },
  status: { type: String, enum: ['healthy', 'degraded', 'down'], required: true },
  latencyMs: { type: Number, required: true },
  errorMessage: { type: String },
  checkedAt: { type: Date, required: true },
});

providerHealthSchema.index({ providerId: 1, checkedAt: -1 });

export default providerHealthSchema;
