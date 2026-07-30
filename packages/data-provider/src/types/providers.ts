export type ProviderCategory = 'text' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type DefaultCategory = 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'ocr' | 'moderation';

export type TAIProvider = {
  _id: string;
  name: string;
  displayName: string;
  category: ProviderCategory;
  enabled: boolean;
  priority: number;
  healthStatus: HealthStatus;
  healthCheckedAt?: string;
  config: Record<string, any>;
  capabilities: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type TProviderModel = {
  _id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  category: ProviderCategory;
  capabilities: string[];
  enabled: boolean;
  maxTokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
  metadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type TProviderKey = {
  _id: string;
  providerId: string;
  name: string;
  keyHash: string;
  maskedKey: string;
  lastUsed?: string;
  lastTested?: string;
  healthStatus: 'healthy' | 'failed';
  enabled: boolean;
  createdBy: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TRoutingRule = {
  _id: string;
  name: string;
  description?: string;
  category: ProviderCategory;
  priority: number;
  conditions: {
    type: 'model_category' | 'latency' | 'cost' | 'capability' | 'prompt_type';
    operator: 'eq' | 'lt' | 'gt' | 'in' | 'contains';
    value: any;
  }[];
  targetProviderId: string;
  targetModelId?: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
  enabled: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TProviderUsage = {
  _id: string;
  date: string;
  requests: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  errors: number;
  avgLatencyMs: number;
};

export type TProviderCostSummary = {
  _id: string;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
};

export type TProviderHealthEntry = {
  _id: string;
  providerId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorMessage?: string;
  checkedAt: string;
};

export type TSystemDefault = {
  _id?: string;
  category: DefaultCategory;
  defaultProviderId?: string;
  fallbackProviderId?: string;
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type TProviderOverview = {
  totalProviders: number;
  enabledProviders: number;
  totalKeys: number;
  totalModels: number;
  healthyProviders: number;
};

export type TProviderKeyCreate = {
  name: string;
  value: string;
  expiresAt?: string;
};
