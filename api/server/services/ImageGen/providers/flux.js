const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const FLUX_BASE = 'https://api.bfl.ml/v1';

const MODELS = [
  { id: 'flux-pro-1.1', name: 'Flux Pro 1.1' },
  { id: 'flux-pro-1.1-ultra', name: 'Flux Pro 1.1 Ultra' },
  { id: 'flux-pro', name: 'Flux Pro' },
  { id: 'flux-dev', name: 'Flux Dev' },
  { id: 'flux-pro-1.0-finetuned', name: 'Flux Pro Finetuned' },
];

const ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21',
];

async function pollResult(url, headers, maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await axios.get(url, { headers });
    if (res.data.status === 'Ready') {
      return res.data.result;
    }
    if (res.data.status === 'Failed' || res.data.status === 'Error') {
      throw new Error(res.data.error || 'Flux generation failed');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Flux generation timed out');
}

async function generate({ model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey }) {
  const key = apiKey || process.env.FLUX_API_KEY;
  if (!key) {
    throw new Error('FLUX_API_KEY is not configured');
  }

  const headers = {
    'x-key': key,
    'Content-Type': 'application/json',
  };

  const body = { prompt };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }

  if (aspectRatio) {
    body.aspect_ratio = aspectRatio;
  }

  if (seed != null) {
    body.seed = seed;
  }

  const modelId = model || MODELS[0].id;
  const endpoint = modelId === 'flux-pro-1.1-ultra' ? '/image-pro-1.1-ultra' : `/${modelId}`;

  try {
    const submitRes = await axios.post(`${FLUX_BASE}${endpoint}`, body, { headers });
    const { id } = submitRes.data;

    const result = await pollResult(`${FLUX_BASE}/get_result?id=${id}`, headers);

    const images = [];
    const rawSamples = result?.samples || [];

    for (const sample of rawSamples) {
      images.push({
        url: sample,
        width: result?.width || undefined,
        height: result?.height || undefined,
      });
    }

    return images;
  } catch (error) {
    logger.error('[Flux] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

module.exports = { generate, MODELS, ASPECT_RATIOS };
