const mongoose = require('mongoose');
const crypto = require('crypto');
const { logger } = require('@librechat/data-schemas');

const AIProvider = () => mongoose.models.AIProvider;
const ProviderKey = () => mongoose.models.ProviderKey;
const ProviderModel = () => mongoose.models.ProviderModel;
const RoutingRule = () => mongoose.models.RoutingRule;
const ProviderUsage = () => mongoose.models.ProviderUsage;
const ProviderHealthLog = () => mongoose.models.ProviderHealthLog;
const SystemDefaults = () => mongoose.models.SystemDefaults;

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback-secret').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + cipher.getAuthTag().toString('hex');
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const authTag = Buffer.from(parts.pop(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskKey(raw) {
  if (!raw || raw.length < 8) { return '****'; }
  return raw.slice(0, 4) + '****' + raw.slice(-4);
}

async function listProviders(filter = {}) {
  return AIProvider().find(filter).sort({ priority: 1, name: 1 }).lean();
}

async function getProvider(id) {
  return AIProvider().findById(id).lean();
}

async function createProvider(data) {
  const provider = await AIProvider().create(data);
  return provider.toObject();
}

async function updateProvider(id, data) {
  return AIProvider().findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

async function deleteProvider(id) {
  await Promise.all([
    ProviderKey().deleteMany({ providerId: id }),
    ProviderModel().deleteMany({ providerId: id }),
    ProviderUsage().deleteMany({ providerId: id }),
    ProviderHealthLog().deleteMany({ providerId: id }),
    RoutingRule().deleteMany({ targetProviderId: id }),
    RoutingRule().deleteMany({ fallbackProviderId: id }),
  ]);
  return AIProvider().findByIdAndDelete(id).lean();
}

async function listProviderKeys(providerId) {
  const keys = await ProviderKey().find({ providerId }).sort({ createdAt: -1 }).lean();
  return keys.map(k => ({ ...k, encryptedKey: undefined }));
}

async function createProviderKey(providerId, data, userId) {
  const keyHash = crypto.createHash('sha256').update(data.value).digest('hex');
  const encryptedKey = encrypt(data.value);
  const maskedKey = maskKey(data.value);
  const key = await ProviderKey().create({
    providerId,
    name: data.name,
    keyHash,
    encryptedKey,
    maskedKey,
    enabled: true,
    healthStatus: 'healthy',
    createdBy: userId,
    expiresAt: data.expiresAt || undefined,
  });
  return { ...key.toObject(), encryptedKey: undefined };
}

async function testProviderKey(keyId) {
  const key = await ProviderKey().findById(keyId);
  if (!key) { throw new Error('Key not found'); }
  const decrypted = decrypt(key.encryptedKey);
  const provider = await AIProvider().findById(key.providerId);
  if (!provider) { throw new Error('Provider not found'); }
  let healthy = false;
  let latencyMs = 0;
  let errorMessage = null;
  const start = Date.now();
  try {
    if (provider.name === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${decrypted}` },
        signal: AbortSignal.timeout(10000),
      });
      healthy = resp.status === 200 || resp.status === 401;
    } else if (provider.name === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        headers: { 'x-api-key': decrypted, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(10000),
      });
      healthy = resp.status === 400 || resp.status === 401;
    } else if (provider.name === 'google' || provider.name === 'vertexai') {
      healthy = true;
    } else if (provider.config?.testEndpoint) {
      const resp = await fetch(provider.config.testEndpoint, {
        headers: { Authorization: `Bearer ${decrypted}` },
        signal: AbortSignal.timeout(10000),
      });
      healthy = resp.ok || resp.status === 401 || resp.status === 403;
    } else {
      healthy = true;
    }
    latencyMs = Date.now() - start;
  } catch (err) {
    latencyMs = Date.now() - start;
    errorMessage = err.message;
    healthy = false;
  }
  await ProviderKey().findByIdAndUpdate(keyId, {
    lastTested: new Date(),
    healthStatus: healthy ? 'healthy' : 'failed',
  });
  await ProviderHealthLog().create({
    providerId: key.providerId,
    status: healthy ? 'healthy' : 'down',
    latencyMs,
    errorMessage,
    checkedAt: new Date(),
  });
  await AIProvider().findByIdAndUpdate(key.providerId, {
    healthStatus: healthy ? 'healthy' : 'down',
    healthCheckedAt: new Date(),
  });
  return { healthy, latencyMs, errorMessage };
}

async function deleteProviderKey(keyId) {
  return ProviderKey().findByIdAndDelete(keyId).lean();
}

async function listModels(providerId) {
  return ProviderModel().find({ providerId }).sort({ modelId: 1 }).lean();
}

async function createModel(data) {
  const model = await ProviderModel().create(data);
  return model.toObject();
}

async function updateModel(id, data) {
  return ProviderModel().findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

async function deleteModel(id) {
  return ProviderModel().findByIdAndDelete(id).lean();
}

async function listRoutingRules(category) {
  const filter = category ? { category } : {};
  return RoutingRule().find(filter).sort({ priority: 1 }).lean();
}

async function createRoutingRule(data) {
  const rule = await RoutingRule().create(data);
  return rule.toObject();
}

async function updateRoutingRule(id, data) {
  return RoutingRule().findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

async function deleteRoutingRule(id) {
  return RoutingRule().findByIdAndDelete(id).lean();
}

async function getSystemDefaults() {
  const defaults = await SystemDefaults().find().lean();
  return defaults;
}

async function upsertSystemDefault(data) {
  return SystemDefaults().findOneAndUpdate(
    { category: data.category },
    { $set: data },
    { upsert: true, new: true },
  ).lean();
}

async function getUsageStats(providerId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const filter = providerId ? { providerId, date: { $gte: since } } : { date: { $gte: since } };
  return ProviderUsage().aggregate([
    { $match: filter },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      requests: { $sum: '$requests' },
      tokensInput: { $sum: '$tokensInput' },
      tokensOutput: { $sum: '$tokensOutput' },
      cost: { $sum: '$cost' },
      errors: { $sum: '$errors' },
      avgLatencyMs: { $avg: '$latencyMs' },
    }},
    { $sort: { _id: 1 } },
  ]);
}

async function getCostSummary(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return ProviderUsage().aggregate([
    { $match: { date: { $gte: since } } },
    { $group: {
      _id: '$providerId',
      totalCost: { $sum: '$cost' },
      totalRequests: { $sum: '$requests' },
      totalTokens: { $sum: { $add: ['$tokensInput', '$tokensOutput'] } },
    }},
    { $sort: { totalCost: -1 } },
  ]);
}

async function recordUsage(entry) {
  return ProviderUsage().create(entry);
}

async function getProviderHealthHistory(providerId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return ProviderHealthLog().find({ providerId, checkedAt: { $gte: since } })
    .sort({ checkedAt: -1 })
    .limit(100)
    .lean();
}

async function getDashboardOverview() {
  const [
    totalProviders,
    enabledProviders,
    totalKeys,
    totalModels,
    healthyProviders,
  ] = await Promise.all([
    AIProvider().countDocuments(),
    AIProvider().countDocuments({ enabled: true }),
    ProviderKey().countDocuments(),
    ProviderModel().countDocuments(),
    AIProvider().countDocuments({ healthStatus: 'healthy' }),
  ]);
  return { totalProviders, enabledProviders, totalKeys, totalModels, healthyProviders };
}

module.exports = {
  encrypt, decrypt, maskKey,
  listProviders, getProvider, createProvider, updateProvider, deleteProvider,
  listProviderKeys, createProviderKey, testProviderKey, deleteProviderKey,
  listModels, createModel, updateModel, deleteModel,
  listRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule,
  getSystemDefaults, upsertSystemDefault,
  getUsageStats, getCostSummary, recordUsage,
  getProviderHealthHistory, getDashboardOverview,
};
