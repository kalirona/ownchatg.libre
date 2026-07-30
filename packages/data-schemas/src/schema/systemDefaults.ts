import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemDefaults extends Document {
  category: 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';
  defaultProviderId?: mongoose.Types.ObjectId;
  fallbackProviderId?: mongoose.Types.ObjectId;
  config: Record<string, any>;
}

const systemDefaultsSchema: Schema<ISystemDefaults> = new Schema({
  category: { type: String, enum: ['chat', 'image', 'video', 'audio', 'embedding', 'ocr', 'moderation'], required: true, unique: true },
  defaultProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider' },
  fallbackProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider' },
  config: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default systemDefaultsSchema;
