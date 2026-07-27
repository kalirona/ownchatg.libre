/**
 * ModelCostRegistry - Centralized pricing and capability data for all supported AI providers.
 *
 * Rates are USD per 1M tokens (prompt / completion).
 * Context is in tokens.
 * Latency tiers: fast (< 1s TTFT), medium (1-3s TTFT), slow (> 3s TTFT)
 * Quality tiers: premium, standard, budget, code
 */

const REGISTRY = {
  openAI: {
    provider: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: {
      'gpt-4o':          { prompt: 2.50, completion: 10.00, context: 128000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'gpt-4o-mini':     { prompt: 0.15, completion: 0.60,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'gpt-5':           { prompt: 1.25, completion: 10.00, context: 400000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'gpt-5.4':         { prompt: 2.50, completion: 15.00, context: 200000, latency: 'medium', quality: 'premium', tier: 'premium' },
      'o3-mini':         { prompt: 1.10, completion: 4.40,  context: 200000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'gpt-4.1':         { prompt: 2.00, completion: 8.00,  context: 1000000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'gpt-4.1-mini':    { prompt: 0.40, completion: 1.60,  context: 1000000, latency: 'fast',   quality: 'standard', tier: 'budget' },
    },
  },
  anthropic: {
    provider: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: {
      'claude-sonnet-4-6':  { prompt: 3.00, completion: 15.00, context: 1000000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'claude-opus-4':      { prompt: 15.00, completion: 75.00, context: 1000000, latency: 'slow',   quality: 'premium', tier: 'premium' },
      'claude-opus-4-5':    { prompt: 5.00, completion: 25.00,  context: 1000000, latency: 'slow',   quality: 'premium', tier: 'premium' },
      'claude-fable-5':     { prompt: 10.00, completion: 50.00, context: 1000000, latency: 'slow',   quality: 'premium', tier: 'premium' },
      'claude-3-5-haiku':   { prompt: 0.80, completion: 4.00,   context: 200000,  latency: 'fast',   quality: 'standard', tier: 'budget' },
    },
  },
  google: {
    provider: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      'gemini-2.5-flash':   { prompt: 0.15, completion: 0.60,  context: 1000000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'gemini-2.5-pro':     { prompt: 1.25, completion: 10.00, context: 1000000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'gemini-2.0-flash':   { prompt: 0.10, completion: 0.40,  context: 1000000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'gemini-3':           { prompt: 2.00, completion: 12.00, context: 1000000, latency: 'medium', quality: 'premium', tier: 'premium' },
      'gemini-3-flash':     { prompt: 0.50, completion: 3.00,  context: 1000000, latency: 'fast',   quality: 'standard', tier: 'budget' },
    },
  },
  groq: {
    provider: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: {
      'llama-3.3-70b':      { prompt: 0.59, completion: 0.79,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'llama-3.1-8b':       { prompt: 0.05, completion: 0.08,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'llama-3.2-90b':      { prompt: 0.90, completion: 0.90,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'mixtral-8x7b':       { prompt: 0.24, completion: 0.24,  context: 32768,  latency: 'fast',   quality: 'standard', tier: 'budget' },
      'gemma2-9b':          { prompt: 0.05, completion: 0.08,  context: 8192,   latency: 'fast',   quality: 'standard', tier: 'budget' },
    },
  },
  openrouter: {
    provider: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: {
      'openrouter/auto':    { prompt: 0.00, completion: 0.00,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'anthropic/claude-sonnet-4':  { prompt: 3.00, completion: 15.00, context: 1000000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'openai/gpt-4o':      { prompt: 2.50, completion: 10.00, context: 128000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'google/gemini-2.5-flash':    { prompt: 0.15, completion: 0.60,  context: 1000000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'meta-llama/llama-3.3-70b':   { prompt: 0.35, completion: 0.49,  context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
    },
  },
  together: {
    provider: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: {
      'meta-llama/Llama-3.3-70B-Instruct-Turbo': { prompt: 0.88, completion: 0.88, context: 128000, latency: 'fast', quality: 'standard', tier: 'budget' },
      'mistralai/Mixtral-8x22B-Instruct-v0.1':    { prompt: 0.90, completion: 0.90, context: 65536,  latency: 'medium', quality: 'standard', tier: 'budget' },
      'deepseek-ai/DeepSeek-V3':                   { prompt: 0.80, completion: 0.80, context: 128000, latency: 'fast',   quality: 'standard', tier: 'budget' },
      'meta-llama/Llama-3.2-90B-Vision-Instruct':  { prompt: 0.90, completion: 0.90, context: 128000, latency: 'medium', quality: 'standard', tier: 'budget' },
    },
  },
  fal: {
    provider: 'Fal AI',
    baseUrl: 'https://fal.run/v1',
    models: {
      'fal-llm':           { prompt: 0.50, completion: 1.00,  context: 32768,  latency: 'medium', quality: 'standard', tier: 'budget' },
    },
  },
  azure: {
    provider: 'Azure OpenAI',
    baseUrl: null,
    models: {},
  },
  bedrock: {
    provider: 'AWS Bedrock',
    baseUrl: null,
    models: {},
  },
  deepseek: {
    provider: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: {
      'deepseek-chat':     { prompt: 0.28, completion: 0.42,  context: 64000,  latency: 'fast',   quality: 'standard', tier: 'budget' },
      'deepseek-reasoner': { prompt: 0.55, completion: 2.19,  context: 64000,  latency: 'medium', quality: 'standard', tier: 'standard' },
    },
  },
  xai: {
    provider: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    models: {
      'grok-3':            { prompt: 3.00, completion: 15.00, context: 256000, latency: 'medium', quality: 'premium', tier: 'standard' },
      'grok-3-fast':       { prompt: 5.00, completion: 25.00, context: 2000000, latency: 'fast',   quality: 'premium', tier: 'premium' },
    },
  },
};

let dynamicModels = [];

function getAllProviders() {
  return Object.keys(REGISTRY);
}

function getProviderInfo(providerKey) {
  return REGISTRY[providerKey] || null;
}

function getModelCost(providerKey, modelName) {
  const provider = REGISTRY[providerKey];
  if (!provider) {
    return null;
  }
  const model = provider.models[modelName];
  if (!model) {
    return null;
  }
  return {
    provider: providerKey,
    providerLabel: provider.provider,
    model: modelName,
    ...model,
    inputCost: model.prompt,
    outputCost: model.completion,
    totalCostPer1M: model.prompt + model.completion,
  };
}

function getAllModels() {
  const all = [];
  for (const [providerKey, provider] of Object.entries(REGISTRY)) {
    for (const [modelName, info] of Object.entries(provider.models)) {
      all.push({
        provider: providerKey,
        providerLabel: provider.provider,
        model: modelName,
        ...info,
        inputCost: info.prompt,
        outputCost: info.completion,
        totalCostPer1M: info.prompt + info.completion,
      });
    }
  }
  for (const dm of dynamicModels) {
    all.push(dm);
  }
  return all;
}

function registerDynamicModel(provider, modelName, info) {
  dynamicModels.push({
    provider,
    providerLabel: provider.charAt(0).toUpperCase() + provider.slice(1),
    model: modelName,
    ...info,
    inputCost: info.prompt,
    outputCost: info.completion,
    totalCostPer1M: info.prompt + info.completion,
  });
}

function findModelBySubstring(substring) {
  const results = [];
  for (const [providerKey, provider] of Object.entries(REGISTRY)) {
    for (const [modelName, info] of Object.entries(provider.models)) {
      if (modelName.toLowerCase().includes(substring.toLowerCase())) {
        results.push({
          provider: providerKey,
          providerLabel: provider.provider,
          model: modelName,
          ...info,
          inputCost: info.prompt,
          outputCost: info.completion,
          totalCostPer1M: info.prompt + info.completion,
        });
      }
    }
  }
  return results;
}

function getCheapestModel(constraints = {}) {
  const {
    minContext = 0,
    maxCost = Infinity,
    preferredProvider = null,
    excludeProviders = [],
    quality = null,
    latency = null,
    tier = null,
  } = constraints;

  let candidates = getAllModels();

  if (minContext > 0) {
    candidates = candidates.filter((m) => m.context >= minContext);
  }
  if (maxCost < Infinity) {
    candidates = candidates.filter((m) => m.totalCostPer1M <= maxCost);
  }
  if (preferredProvider) {
    const preferred = candidates.filter((m) => m.provider === preferredProvider);
    if (preferred.length > 0) {
      candidates = preferred;
    }
  }
  if (excludeProviders.length > 0) {
    candidates = candidates.filter((m) => !excludeProviders.includes(m.provider));
  }
  if (quality) {
    candidates = candidates.filter((m) => m.quality === quality);
  }
  if (latency) {
    candidates = candidates.filter((m) => m.latency === latency);
  }
  if (tier) {
    candidates = candidates.filter((m) => m.tier === tier);
  }

  candidates.sort((a, b) => a.totalCostPer1M - b.totalCostPer1M);

  return candidates.length > 0 ? candidates[0] : null;
}

function getBestValueModel(constraints = {}) {
  const {
    minContext = 0,
    maxCost = Infinity,
    preferredProvider = null,
    excludeProviders = [],
    mode = 'balanced',
  } = constraints;

  let candidates = getAllModels();

  if (minContext > 0) {
    candidates = candidates.filter((m) => m.context >= minContext);
  }
  if (maxCost < Infinity) {
    candidates = candidates.filter((m) => m.totalCostPer1M <= maxCost);
  }
  if (preferredProvider) {
    const preferred = candidates.filter((m) => m.provider === preferredProvider);
    if (preferred.length > 0) {
      candidates = preferred;
    }
  }
  if (excludeProviders.length > 0) {
    candidates = candidates.filter((m) => !excludeProviders.includes(m.provider));
  }

  if (candidates.length === 0) {
    return null;
  }

  const qualityScore = { premium: 10, standard: 5, budget: 1 };
  const latencyScore = { fast: 10, medium: 5, slow: 1 };
  const maxTotalCost = Math.max(...candidates.map((m) => m.totalCostPer1M));
  const minTotalCost = Math.min(...candidates.map((m) => m.totalCostPer1M));
  const costRange = maxTotalCost - minTotalCost || 1;

  candidates = candidates.map((m) => {
    const costVal = 1 - ((m.totalCostPer1M - minTotalCost) / costRange);
    const qualVal = (qualityScore[m.quality] || 5) / 10;
    const latVal = (latencyScore[m.latency] || 5) / 10;
    const ctxVal = Math.min(m.context / 1000000, 1);

    let score;
    if (mode === 'cost') {
      score = costVal * 0.8 + qualVal * 0.1 + latVal * 0.05 + ctxVal * 0.05;
    } else if (mode === 'quality') {
      score = qualVal * 0.6 + costVal * 0.2 + latVal * 0.1 + ctxVal * 0.1;
    } else if (mode === 'speed') {
      score = latVal * 0.6 + costVal * 0.2 + qualVal * 0.1 + ctxVal * 0.1;
    } else {
      score = costVal * 0.35 + qualVal * 0.3 + latVal * 0.25 + ctxVal * 0.1;
    }

    return { ...m, _score: score };
  });

  candidates.sort((a, b) => b._score - a._score);
  return candidates[0];
}

module.exports = {
  REGISTRY,
  getAllProviders,
  getProviderInfo,
  getModelCost,
  getAllModels,
  registerDynamicModel,
  findModelBySubstring,
  getCheapestModel,
  getBestValueModel,
};
