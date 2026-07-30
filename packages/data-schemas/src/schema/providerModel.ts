import mongoose, { Schema, Document } from 'mongoose';

export interface IProviderModel extends Document {
  providerId: mongoose.Types.ObjectId;
  modelId: string;
  displayName: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'embedding';
  capabilities: string[];
  enabled: boolean;
  maxTokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const providerModelSchema: Schema<IProviderModel> = new Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider', required: true },
  modelId: { type: String, required: true },
  displayName: { type: String, required: true },
  category: { type: String, enum: ['text', 'image', 'video', 'audio', 'embedding'], required: true },
  capabilities: [{ type: String }],
  enabled: { type: Boolean, default: true },
  maxTokens: { type: Number },
  pricing: {
    input: { type: Number },
    output: { type: Number },
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

providerModelSchema.index({ providerId: 1, modelId: 1 }, { unique: true });
providerModelSchema.index({ category: 1, enabled: 1 });

export default providerModelSchema;
