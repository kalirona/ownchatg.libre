const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const LUMA_BASE = 'https://api.lumalabs.ai/dream-machine/v1';

const MODELS = [
  { id: 'ray-2', name: 'Ray 2' },
  { id: 'ray-1-6', name: 'Ray 1.6' },
];

const DURATION_LIMITS = {
  'ray-2': { min: 5, max: 10 },
  'ray-1-6': { min: 5, max: 10 },
};

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];

async function pollGeneration(id, headers, maxRetries = 180) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await axios.get(`${LUMA_BASE}/generations/${id}`, { headers });

    if (res.data.state === 'completed') {
      return res.data;
    }

    if (res.data.state === 'failed') {
      throw new Error(res.data.failure_reason || 'Luma generation failed');
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Luma generation timed out');
}

async function generate({ model, prompt, duration, aspectRatio, quality, apiKey }) {
  const key = apiKey || process.env.LUMA_API_KEY;
  if (!key) {
    throw new Error('LUMA_API_KEY is not configured');
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const body = {
    model: model || MODELS[0].id,
    prompt,
  };

  if (aspectRatio) {
    body.aspect_ratio = aspectRatio;
  }

  if (quality === 'premium') {
    body.resolution = 'high';
  }

  try {
    const createRes = await axios.post(`${LUMA_BASE}/generations`, body, { headers });
    const generationId = createRes.data.id;

    if (!generationId) {
      return parseResult(createRes.data);
    }

    const result = await pollGeneration(generationId, headers);
    return parseResult(result);
  } catch (error) {
    logger.error('[Luma] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

function parseResult(data) {
  const videos = [];
  const assets = data.assets || {};

  if (assets.video_url) {
    videos.push({ url: assets.video_url, width: assets.width, height: assets.height });
  }

  if (data.output?.video_url) {
    videos.push({ url: data.output.video_url });
  }

  if (videos.length === 0 && data.video_url) {
    videos.push({ url: data.video_url });
  }

  return videos;
}

module.exports = { generate, MODELS, DURATION_LIMITS, ASPECT_RATIOS };
