const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const MODELS = [
  { id: 'imagen-3.0-generate-001', name: 'Imagen 3.0 Generate' },
  { id: 'imagen-3.0-capability-001', name: 'Imagen 3.0 Capability' },
];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function generate({ model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey }) {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY or GOOGLE_KEY is not configured');
  }

  const modelId = model || MODELS[0].id;

  const aspectRatioPrompt = aspectRatio ? `, aspect ratio ${aspectRatio}` : '';

  const contents = [];

  if (negativePrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: `Generate an image that does NOT have: ${negativePrompt}` }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: `${prompt}${aspectRatioPrompt}` }],
  });

  const body = {
    contents,
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  if (seed != null) {
    body.generationConfig.seed = seed;
  }

  try {
    const url = `${API_BASE}/models/${modelId}:generateContent?key=${key}`;
    const response = await axios.post(url, body);
    const data = response.data;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No image generated');
    }

    const images = [];
    for (const candidate of data.candidates) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          images.push({
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            b64_json: part.inlineData.data,
            width: undefined,
            height: undefined,
          });
        }
      }
    }

    return images;
  } catch (error) {
    logger.error('[Imagen] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

module.exports = { generate, MODELS };
