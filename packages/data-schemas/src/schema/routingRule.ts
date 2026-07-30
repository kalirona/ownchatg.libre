import mongoose, { Schema, Document } from 'mongoose';

export interface IRoutingRule extends Document {
  name: string;
  description?: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'embedding';
  priority: number;
  conditions: {
    type: 'model_category' | 'latency' | 'cost' | 'capability' | 'prompt_type';
    operator: 'eq' | 'lt' | 'gt' | 'in' | 'contains';
    value: any;
  }[];
  targetProviderId: mongoose.Types.ObjectId;
  targetModelId?: string;
  fallbackProviderId?: mongoose.Types.ObjectId;
  fallbackModelId?: string;
  enabled: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const routingRuleSchema: Schema<IRoutingRule> = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['text', 'image', 'video', 'audio', 'embedding'], required: true },
  priority: { type: Number, default: 100 },
  conditions: [{
    type: { type: String, enum: ['model_category', 'latency', 'cost', 'capability', 'prompt_type'], required: true },
    operator: { type: String, enum: ['eq', 'lt', 'gt', 'in', 'contains'], required: true },
    value: { type: Schema.Types.Mixed, required: true },
  }],
  targetProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider', required: true },
  targetModelId: { type: String },
  fallbackProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider' },
  fallbackModelId: { type: String },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

routingRuleSchema.index({ category: 1, priority: 1, enabled: 1 });

export default routingRuleSchema;
