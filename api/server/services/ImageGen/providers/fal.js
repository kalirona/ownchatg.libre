const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const FAL_BASE = 'https://fal.run/fal-ai';

const MODELS = [
  { id: 'fal-ai/flux-pro/v1.1-ultra', name: 'Flux Pro 1.1 Ultra' },
  { id: 'fal-ai/flux-pro/v1.1', name: 'Flux Pro 1.1' },
  { id: 'fal-ai/flux-pro', name: 'Flux Pro' },
  { id: 'fal-ai/flux-dev', name: 'Flux Dev' },
  { id: 'fal-ai/flux/schnell', name: 'Flux Schnell' },
  { id: 'fal-ai/stable-diffusion-v3-medium', name: 'SD3 Medium' },
  { id: 'fal-ai/ideogram/v2', name: 'Ideogram V2' },
  { id: 'fal-ai/recraft-v3', name: 'Recraft V3' },
];

async function generate({ model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey }) {
  const key = apiKey || process.env.FAL_API_KEY;
  if (!key) {
    throw new Error('FAL_API_KEY is not configured');
  }

  const headers = {
    Authorization: `Key ${key}`,
    'Content-Type': 'application/json',
  };

  const body = {
    prompt,
    num_images: numImages || 1,
    image_size: aspectRatio || 'square_hd',
    enable_safety_checker: false,
  };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }

  if (seed != null) {
    body.seed = seed;
  }

  const modelId = model || MODELS[0].id;
  const submitUrl = `${FAL_BASE}/${modelId}`;

  try {
    const submitRes = await axios.post(submitUrl, body, { headers });
    const result = submitRes.data;

    const images = [];
    const rawImages = result.images || (result.image ? [result.image] : []);

    for (const img of rawImages) {
      const url = img.url || img;
      images.push({
        url,
        width: img.width || undefined,
        height: img.height || undefined,
        content_type: img.content_type || 'image/png',
      });
    }

    return images;
  } catch (error) {
    logger.error('[FalAI] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

module.exports = { generate, MODELS };
