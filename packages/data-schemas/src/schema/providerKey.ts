import mongoose, { Schema, Document } from 'mongoose';

export interface IProviderKey extends Document {
  providerId: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  encryptedKey: string;
  maskedKey: string;
  lastUsed?: Date;
  lastTested?: Date;
  healthStatus: 'healthy' | 'failed';
  enabled: boolean;
  createdBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const providerKeySchema: Schema<IProviderKey> = new Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProvider', required: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true },
  encryptedKey: { type: String, required: true },
  maskedKey: { type: String, required: true },
  lastUsed: { type: Date },
  lastTested: { type: Date },
  healthStatus: { type: String, enum: ['healthy', 'failed'], default: 'healthy' },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date },
}, { timestamps: true });

providerKeySchema.index({ providerId: 1 });
providerKeySchema.index({ keyHash: 1 });
providerKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default providerKeySchema;
