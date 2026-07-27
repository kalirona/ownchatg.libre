const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const RUNWAY_BASE = 'https://api.runwayml.com/v1';

const MODELS = [
  { id: 'gen3a_turbo', name: 'Gen-3 Alpha Turbo' },
  { id: 'gen3a', name: 'Gen-3 Alpha' },
];

const DURATION_LIMITS = {
  gen3a_turbo: { min: 5, max: 10 },
  gen3a: { min: 5, max: 10 },
};

async function pollTask(taskId, headers, maxRetries = 120) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await axios.get(`${RUNWAY_BASE}/tasks/${taskId}`, { headers });

    if (res.data.status === 'SUCCEEDED') {
      return res.data.output;
    }

    if (res.data.status === 'FAILED') {
      throw new Error(res.data.error || 'Runway generation failed');
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error('Runway generation timed out');
}

async function generate({ model, prompt, duration, aspectRatio, quality, apiKey }) {
  const key = apiKey || process.env.RUNWAY_API_KEY;
  if (!key) {
    throw new Error('RUNWAY_API_KEY is not configured');
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const modelId = model || MODELS[0].id;

  const body = {
    model: modelId,
    prompt,
    duration: duration || 5,
    aspect_ratio: aspectRatio || '16:9',
  };

  try {
    const createRes = await axios.post(`${RUNWAY_BASE}/image_to_video`, body, { headers });
    const taskId = createRes.data.id;

    if (!taskId) {
      return parseResult(createRes.data);
    }

    const output = await pollTask(taskId, headers);
    return parseResult({ output }, modelId);
  } catch (error) {
    logger.error('[Runway] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

function parseResult(data) {
  const videos = [];

  if (data.output?.url) {
    videos.push({ url: data.output.url });
  } else if (data.output?.videos) {
    for (const v of data.output.videos) {
      videos.push({ url: v.url, width: v.width, height: v.height });
    }
  } else if (data.url) {
    videos.push({ url: data.url });
  }

  return videos;
}

module.exports = { generate, MODELS, DURATION_LIMITS };
