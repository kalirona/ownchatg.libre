import type { Types } from 'mongoose';

export interface IAIProvider {
  _id?: Types.ObjectId;
  name: string;
  displayName: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';
  enabled: boolean;
  priority: number;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  healthCheckedAt?: Date;
  config: Record<string, any>;
  capabilities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProviderModel {
  _id?: Types.ObjectId;
  providerId: Types.ObjectId;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProviderKey {
  _id?: Types.ObjectId;
  providerId: Types.ObjectId;
  name: string;
  keyHash: string;
  encryptedKey: string;
  maskedKey: string;
  lastUsed?: Date;
  lastTested?: Date;
  healthStatus: 'healthy' | 'failed';
  enabled: boolean;
  createdBy: Types.ObjectId;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoutingRule {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'embedding';
  priority: number;
  conditions: {
    type: 'model_category' | 'latency' | 'cost' | 'capability' | 'prompt_type';
    operator: 'eq' | 'lt' | 'gt' | 'in' | 'contains';
    value: any;
  }[];
  targetProviderId: Types.ObjectId;
  targetModelId?: string;
  fallbackProviderId?: Types.ObjectId;
  fallbackModelId?: string;
  enabled: boolean;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProviderUsage {
  _id?: Types.ObjectId;
  providerId: Types.ObjectId;
  modelId?: string;
  date: Date;
  requests: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  errors: number;
  latencyMs: number;
  userId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
}

export interface IProviderHealth {
  _id?: Types.ObjectId;
  providerId: Types.ObjectId;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorMessage?: string;
  checkedAt: Date;
}

export interface ISystemDefaults {
  _id?: Types.ObjectId;
  category: 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';
  defaultProviderId?: Types.ObjectId;
  fallbackProviderId?: Types.ObjectId;
  config: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
