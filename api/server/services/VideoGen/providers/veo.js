const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const MODELS = [
  { id: 'veo-2.0-generate-preview', name: 'Veo 2.0' },
];

const DURATION_LIMITS = {
  'veo-2.0-generate-preview': { min: 5, max: 60 },
};

async function generate({ model, prompt, duration, aspectRatio, quality, apiKey }) {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY or GOOGLE_KEY is not configured for Veo');
  }

  const modelId = model || MODELS[0].id;

  const aspectRatioPrompt = aspectRatio ? `, aspect ratio ${aspectRatio}` : '';

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${prompt}${aspectRatioPrompt}` }],
      },
    ],
    generationConfig: {
      responseModalities: ['VIDEO', 'TEXT'],
    },
  };

  if (duration) {
    const durationSec = Math.max(5, Math.min(60, duration));
    body.generationConfig.duration = `${durationSec}s`;
  }

  if (quality === 'premium') {
    body.generationConfig.enhance = true;
  }

  try {
    const url = `${API_BASE}/models/${modelId}:generateContent?key=${key}`;
    const response = await axios.post(url, body, { timeout: 180000 });
    const data = response.data;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No video generated');
    }

    const videos = [];
    for (const candidate of data.candidates) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('video/')) {
          videos.push({
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            b64_json: part.inlineData.data,
            width: undefined,
            height: undefined,
          });
        }
      }
    }

    if (videos.length === 0) {
      throw new Error('Response contained no video data');
    }

    return videos;
  } catch (error) {
    logger.error('[Veo] Generation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

module.exports = { generate, MODELS, DURATION_LIMITS };
