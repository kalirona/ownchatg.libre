const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const FAL_BASE = 'https://fal.run/fal-ai';

const MODELS = [
  { id: 'fal-ai/runway-gen3', name: 'Runway Gen-3 Alpha' },
  { id: 'fal-ai/runway-gen3/turbo', name: 'Runway Gen-3 Alpha Turbo' },
  { id: 'fal-ai/kling-video/v1-6/pro', name: 'Kling 1.6 Pro' },
  { id: 'fal-ai/kling-video/v1-5/pro', name: 'Kling 1.5 Pro' },
  { id: 'fal-ai/kling-video/v1-5/standard', name: 'Kling 1.5 Standard' },
  { id: 'fal-ai/minimax/video-01-live', name: 'MiniMax Video-01 Live' },
];

const DURATION_LIMITS = {
  'fal-ai/runway-gen3': { min: 5, max: 10 },
  'fal-ai/runway-gen3/turbo': { min: 5, max: 10 },
  'fal-ai/kling-video/v1-6/pro': { min: 5, max: 10 },
  'fal-ai/kling-video/v1-5/pro': { min: 5, max: 10 },
  'fal-ai/kling-video/v1-5/standard': { min: 5, max: 10 },
  'fal-ai/minimax/video-01-live': { min: 5, max: 10 },
};

async function pollResult(url, headers, maxRetries = 120) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await axios.get(url, { headers });
    const status = res.data.status;

    if (status === 'COMPLETED') {
      return res.data;
    }

    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error(res.data.error || 'Fal AI video generation failed');
    }

    if (res.data.output) {
      return { status: 'COMPLETED', ...res.data };
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Fal AI video generation timed out');
}

async function generate({ model, prompt, duration, aspectRatio, quality, apiKey }) {
  const key = apiKey || process.env.FAL_API_KEY;
  if (!key) {
    throw new Error('FAL_API_KEY is not configured');
  }

  const headers = {
    Authorization: `Key ${key}`,
    'Content-Type': 'application/json',
  };

  const modelId = model || MODELS[0].id;
  const submitUrl = `${FAL_BASE}/${modelId}`;

  const body = { prompt };

  if (duration) {
    body.duration = duration;
  }
  if (aspectRatio) {
    body.aspect_ratio = aspectRatio;
  }

  const limits = DURATION_LIMITS[modelId];
  if (limits && duration) {
    body.duration = Math.max(limits.min, Math.min(limits.max, duration));
  }

  try {
    const submitRes = await axios.post(submitUrl, body, { headers });

    if (submitRes.data.request_id) {
      const result = await pollResult(`${FAL_BASE}/requests/${submitRes.data.request_id}/status`, headers);
      return parseResult(result, modelId);
    }

    return parseResult(submitRes.data, modelId);
  } catch (error) {
    logger.error('[FalAI-Video] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

function parseResult(data, modelId) {
  const videos = [];
  const rawVideos = data.video ? [data.video] : data.videos || (data.output?.video ? [data.output.video] : data.output?.videos || []);

  for (const vid of rawVideos) {
    const url = vid.url || vid;
    videos.push({
      url,
      width: vid.width || undefined,
      height: vid.height || undefined,
      duration: vid.duration || undefined,
      content_type: vid.content_type || 'video/mp4',
    });
  }

  return videos;
}

module.exports = { generate, MODELS, DURATION_LIMITS };
