import mongoose, { Schema, Document } from 'mongoose';

export interface IAIProvider extends Document {
  name: string;
  displayName: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';
  enabled: boolean;
  priority: number;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  healthCheckedAt?: Date;
  config: Record<string, any>;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const aiProviderSchema: Schema<IAIProvider> = new Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, enum: ['text', 'image', 'video', 'audio', 'embedding', 'ocr', 'moderation'], required: true },
  enabled: { type: Boolean, default: true },
  priority: { type: Number, default: 100 },
  healthStatus: { type: String, enum: ['healthy', 'degraded', 'down', 'unknown'], default: 'unknown' },
  healthCheckedAt: { type: Date },
  config: { type: Schema.Types.Mixed, default: {} },
  capabilities: [{ type: String }],
}, { timestamps: true });

aiProviderSchema.index({ category: 1, enabled: 1 });
aiProviderSchema.index({ priority: 1 });

export default aiProviderSchema;
