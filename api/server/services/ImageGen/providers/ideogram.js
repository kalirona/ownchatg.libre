const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const IDEOGRAM_BASE = 'https://api.ideogram.ai';

const MODELS = [
  { id: 'V_2', name: 'Ideogram V2' },
  { id: 'V_2_TURBO', name: 'Ideogram V2 Turbo' },
];

const ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '1:2', '2:1',
];

const RESOLUTION_MAP = {
  '1:1': '1024x1024',
  '16:9': '1344x768',
  '9:16': '768x1344',
  '4:3': '1152x896',
  '3:4': '896x1152',
  '3:2': '1216x832',
  '2:3': '832x1216',
  '1:2': '960x1344',
  '2:1': '1344x960',
};

async function generate({ model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey }) {
  const key = apiKey || process.env.IDEOGRAM_API_KEY;
  if (!key) {
    throw new Error('IDEOGRAM_API_KEY is not configured');
  }

  const headers = {
    'Api-Key': key,
    'Content-Type': 'application/json',
  };

  const body = {
    image_request: {
      prompt,
      model: model || MODELS[0].id,
      n: numImages || 1,
    },
  };

  if (negativePrompt) {
    body.image_request.negative_prompt = negativePrompt;
  }

  if (aspectRatio) {
    const res = RESOLUTION_MAP[aspectRatio];
    if (res) {
      const [w, h] = res.split('x');
      body.image_request.width = parseInt(w, 10);
      body.image_request.height = parseInt(h, 10);
    }
  }

  if (seed != null) {
    body.image_request.seed = seed;
  }

  try {
    const response = await axios.post(`${IDEOGRAM_BASE}/generate`, body, { headers });
    const data = response.data;

    const images = (data.data || []).map((item) => ({
      url: item.url,
      width: item.resolution?.split('x')[0] ? parseInt(item.resolution.split('x')[0], 10) : undefined,
      height: item.resolution?.split('x')[1] ? parseInt(item.resolution.split('x')[1], 10) : undefined,
    }));

    return images;
  } catch (error) {
    logger.error('[Ideogram] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

module.exports = { generate, MODELS, ASPECT_RATIOS };
