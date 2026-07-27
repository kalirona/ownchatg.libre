const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const MODELS = [
  { id: 'openai/dall-e-3', name: 'DALL-E 3' },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro' },
  { id: 'black-forest-labs/flux-pro', name: 'Flux Pro' },
  { id: 'black-forest-labs/flux-dev', name: 'Flux Dev' },
  { id: 'openai/gpt-image-1', name: 'GPT Image 1' },
];

async function generate({ model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey }) {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:3080',
  };

  const modelId = model || MODELS[0].id;

  const size = aspectRatioToSize(aspectRatio);

  const body = {
    model: modelId,
    prompt,
    n: numImages || 1,
    size,
    response_format: 'b64_json',
  };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }

  try {
    const response = await axios.post(`${OPENROUTER_BASE}/images/generations`, body, { headers });
    const data = response.data;

    const images = (data.data || []).map((item) => ({
      url: item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : null),
      b64_json: item.b64_json,
      width: item.width || undefined,
      height: item.height || undefined,
    }));

    return images;
  } catch (error) {
    logger.error('[OpenRouter] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

function aspectRatioToSize(ratio) {
  const map = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1024x768',
    '3:4': '768x1024',
    '3:2': '1216x832',
    '2:3': '832x1216',
  };
  return map[ratio] || '1024x1024';
}

module.exports = { generate, MODELS };
