const { logger } = require('@librechat/data-schemas');
const MediaHistory = require('~/server/models/MediaHistory');
const ImageGenService = require('~/server/services/ImageGen/ImageGenService');
const VideoGenService = require('~/server/services/VideoGen/VideoGenService');
const AIRouterService = require('~/server/services/AIRouterService');

const MEDIA_CREDIT_COSTS = {
  image: { fast: 5, balanced: 10, best: 20 },
  video: { fast: 15, standard: 30, cinema: 60 },
};

const PRESET_ASPECT_MAP = {
  'marketing-ad': '16:9', 'product-photography': '1:1', 'social-media': '1:1',
  'logo-concept': '1:1', 'thumbnail': '16:9', 'anime': '3:2',
  'interior-design': '16:9', 'real-estate': '16:9', 'fashion': '9:16', 'character-design': '3:2',
};

const PRESET_STYLE_MAP = {
  'marketing-ad': 'photo', 'product-photography': 'product', 'social-media': 'illustration',
  'logo-concept': 'logo', 'thumbnail': 'photo', 'anime': 'anime',
  'interior-design': 'photo', 'real-estate': 'photo', 'fashion': 'portrait', 'character-design': 'fantasy',
};

const QUALITY_SPEED = { fast: 'fast', balanced: 'balanced', best: 'best', standard: 'balanced', cinema: 'best' };

async function resolveRouting(type, quality, preset) {
  const speed = typeof quality === 'string' ? QUALITY_SPEED[quality] || quality : 'balanced';
  try {
    const rules = await AIRouterService.listRoutingRules(type);
    if (rules && rules.length > 0) {
      const matched = rules.find((r) => {
        if (!r.condition) { return false; }
        return r.condition.value === speed || r.condition.value === quality || r.condition.value === type;
      });
      if (matched) {
        return { modelId: matched.targetModelId, fallbackModelId: matched.fallbackModelId, rule: matched };
      }
    }
  } catch (e) {
    logger.warn('[MediaService] No routing rules found, using defaults:', e.message);
  }
  return null;
}

function getDefaultProviderAndModel(type, quality) {
  if (type === 'image') {
    if (quality === 'best') return { provider: 'flux', model: 'flux-pro-1.1-ultra' };
    if (quality === 'balanced') return { provider: 'flux', model: 'flux-pro' };
    return { provider: 'flux', model: 'flux-dev' };
  }
  if (quality === 'cinema') return { provider: 'fal', model: 'luma-dream-machine' };
  if (quality === 'standard') return { provider: 'fal', model: 'runway-gen3' };
  return { provider: 'fal', model: 'runway-gen3' };
}

async function recordUsage(provider, model, type, creditCost) {
  try {
    await AIRouterService.recordUsage({
      providerId: provider,
      modelId: model,
      date: new Date(),
      requests: 1,
      cost: creditCost,
      tokensInput: 0,
      tokensOutput: 0,
      errors: 0,
      latencyMs: 0,
    });
  } catch (e) {
    logger.warn('[MediaService] Failed to record usage:', e.message);
  }
}

function convertToGenericModel(routingResolved) {
  if (!routingResolved) { return null; }
  const { modelId, fallbackModelId } = routingResolved;
  if (modelId && modelId.startsWith('flux-')) return { provider: 'flux', model: modelId, fallbackProvider: null, fallbackModel: null };
  if (modelId && (modelId.startsWith('luma-') || modelId.startsWith('runway-'))) return { provider: 'fal', model: modelId, fallbackProvider: null, fallbackModel: null };
  return { provider: 'flux', model: modelId, fallbackProvider: 'flux', fallbackModel: fallbackModelId };
}

async function generateImage({ preset, quality, style, aspectRatio, numImages, prompt, negativePrompt, seed, cfg, steps, req }) {
  const resolved = await resolveRouting('image', quality, preset);
  let pm = null;
  if (resolved && resolved.modelId) {
    pm = convertToGenericModel(resolved);
  }
  if (!pm) {
    pm = getDefaultProviderAndModel('image', quality);
  }
  const providerKey = pm.provider;
  const modelKey = pm.model;

  try {
    const images = await ImageGenService.generateImage({
      provider: providerKey,
      model: modelKey,
      prompt,
      negativePrompt,
      aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '1:1',
      seed,
      numImages: numImages || 1,
      req,
    });

    const creditCost = MEDIA_CREDIT_COSTS.image[quality] || MEDIA_CREDIT_COSTS.image.balanced;
    await recordUsage(providerKey, modelKey, 'image', creditCost);

    const history = await MediaHistory.create({
      user: req.user.id,
      type: 'image',
      preset: preset || null,
      quality,
      style: style || PRESET_STYLE_MAP[preset] || null,
      aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '1:1',
      prompt,
      negativePrompt: negativePrompt || '',
      seed: seed != null ? seed : null,
      numImages: numImages || 1,
      provider: providerKey,
      model: modelKey,
      images,
      creditsCost: creditCost,
      status: 'completed',
      tenantId: req.user.tenantId,
    });

    return { images, historyId: history._id, status: 'completed' };
  } catch (err) {
    logger.error(`[MediaService] Image gen failed with ${providerKey}:`, err.message);

    if (pm && pm.fallbackProvider && pm.fallbackModel) {
      logger.info(`[MediaService] Failing over to ${pm.fallbackProvider}/${pm.fallbackModel}`);
      try {
        const images = await ImageGenService.generateImage({
          provider: pm.fallbackProvider,
          model: pm.fallbackModel,
          prompt,
          negativePrompt,
          aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '1:1',
          seed,
          numImages: numImages || 1,
          req,
        });
        const creditCost = MEDIA_CREDIT_COSTS.image[quality] || MEDIA_CREDIT_COSTS.image.balanced;
        await recordUsage(pm.fallbackProvider, pm.fallbackModel, 'image', creditCost);
        const history = await MediaHistory.create({
          user: req.user.id,
          type: 'image',
          preset: preset || null,
          quality,
          style: style || PRESET_STYLE_MAP[preset] || null,
          aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '1:1',
          prompt,
          negativePrompt: negativePrompt || '',
          seed: seed != null ? seed : null,
          numImages: numImages || 1,
          provider: pm.fallbackProvider,
          model: pm.fallbackModel,
          images,
          creditsCost: creditCost,
          status: 'completed',
          tenantId: req.user.tenantId,
        });
        return { images, historyId: history._id, status: 'completed' };
      } catch (fallbackErr) {
        logger.error(`[MediaService] Fallback failed too:`, fallbackErr.message);
        const history = await MediaHistory.create({
          user: req.user.id,
          type: 'image',
          prompt,
          quality,
          status: 'failed',
          error: err.message,
          creditsCost: 0,
          tenantId: req.user.tenantId,
        });
        throw new Error(`Generation failed. ${err.message}`);
      }
    }

    const history = await MediaHistory.create({
      user: req.user.id,
      type: 'image',
      prompt,
      quality,
      status: 'failed',
      error: err.message,
      creditsCost: 0,
      tenantId: req.user.tenantId,
    });
    throw new Error(`Image generation failed: ${err.message}`);
  }
}

async function generateVideo({ preset, quality, duration, aspectRatio, prompt, motionStrength, cameraMotion, negativePrompt, seed, req }) {
  const resolved = await resolveRouting('video', quality, preset);
  let pm = null;
  if (resolved && resolved.modelId) {
    pm = convertToGenericModel(resolved);
  }
  if (!pm) {
    pm = getDefaultProviderAndModel('video', quality);
  }
  const providerKey = pm.provider;
  const modelKey = pm.model;

  try {
    const videos = await VideoGenService.generateVideo({
      provider: providerKey,
      model: modelKey,
      prompt,
      duration: duration || 5,
      aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '16:9',
      quality,
      req,
    });

    const creditCost = MEDIA_CREDIT_COSTS.video[quality] || MEDIA_CREDIT_COSTS.video.standard;
    await recordUsage(providerKey, modelKey, 'video', creditCost);

    const history = await MediaHistory.create({
      user: req.user.id,
      type: 'video',
      preset: preset || null,
      quality,
      duration: duration || 5,
      aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '16:9',
      prompt,
      negativePrompt: negativePrompt || '',
      seed: seed != null ? seed : null,
      motionStrength: motionStrength || null,
      cameraMotion: cameraMotion || null,
      provider: providerKey,
      model: modelKey,
      videos,
      creditsCost: creditCost,
      status: 'completed',
      tenantId: req.user.tenantId,
    });

    return { videos, historyId: history._id, status: 'completed' };
  } catch (err) {
    logger.error(`[MediaService] Video gen failed with ${providerKey}:`, err.message);

    if (pm && pm.fallbackProvider && pm.fallbackModel) {
      logger.info(`[MediaService] Failing over to ${pm.fallbackProvider}/${pm.fallbackModel}`);
      try {
        const videos = await VideoGenService.generateVideo({
          provider: pm.fallbackProvider,
          model: pm.fallbackModel,
          prompt,
          duration: duration || 5,
          aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '16:9',
          quality,
          req,
        });
        const creditCost = MEDIA_CREDIT_COSTS.video[quality] || MEDIA_CREDIT_COSTS.video.standard;
        await recordUsage(pm.fallbackProvider, pm.fallbackModel, 'video', creditCost);
        const history = await MediaHistory.create({
          user: req.user.id,
          type: 'video',
          preset: preset || null,
          quality,
          duration: duration || 5,
          aspectRatio: aspectRatio || PRESET_ASPECT_MAP[preset] || '16:9',
          prompt,
          negativePrompt: negativePrompt || '',
          seed: seed != null ? seed : null,
          motionStrength: motionStrength || null,
          cameraMotion: cameraMotion || null,
          provider: pm.fallbackProvider,
          model: pm.fallbackModel,
          videos,
          creditsCost: creditCost,
          status: 'completed',
          tenantId: req.user.tenantId,
        });
        return { videos, historyId: history._id, status: 'completed' };
      } catch (fallbackErr) {
        logger.error(`[MediaService] Fallback failed too:`, fallbackErr.message);
        await MediaHistory.create({
          user: req.user.id,
          type: 'video',
          prompt,
          quality,
          status: 'failed',
          error: err.message,
          creditsCost: 0,
          tenantId: req.user.tenantId,
        });
        throw new Error(`Video generation failed. ${err.message}`);
      }
    }

    await MediaHistory.create({
      user: req.user.id,
      type: 'video',
      prompt,
      quality,
      status: 'failed',
      error: err.message,
      creditsCost: 0,
      tenantId: req.user.tenantId,
    });
    throw new Error(`Video generation failed: ${err.message}`);
  }
}

async function retryGeneration(historyId, req) {
  const existing = await MediaHistory.findOne({ _id: historyId, user: req.user.id });
  if (!existing) { throw new Error('History entry not found'); }
  if (existing.type === 'image') {
    return generateImage({
      preset: existing.preset,
      quality: existing.quality,
      style: existing.style,
      aspectRatio: existing.aspectRatio,
      numImages: existing.numImages,
      prompt: existing.prompt,
      negativePrompt: existing.negativePrompt,
      seed: existing.seed,
      req,
    });
  }
  return generateVideo({
    preset: existing.preset,
    quality: existing.quality,
    duration: existing.duration,
    aspectRatio: existing.aspectRatio,
    prompt: existing.prompt,
    motionStrength: existing.motionStrength,
    cameraMotion: existing.cameraMotion,
    negativePrompt: existing.negativePrompt,
    seed: existing.seed,
    req,
  });
}

const PRESETS = [
  { id: 'marketing-ad', name: 'Marketing Ad', description: 'High-conversion ad creatives', icon: '📢', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'product-photography', name: 'Product Photography', description: 'Professional product shots', icon: '📦', recommendedStyle: 'product', recommendedAspectRatio: '1:1' },
  { id: 'social-media', name: 'Social Media', description: 'Optimized for social platforms', icon: '📱', recommendedStyle: 'illustration', recommendedAspectRatio: '1:1' },
  { id: 'logo-concept', name: 'Logo Concept', description: 'Brand logo ideas and concepts', icon: '🎯', recommendedStyle: 'logo', recommendedAspectRatio: '1:1' },
  { id: 'thumbnail', name: 'Thumbnail', description: 'Click-optimized video thumbnails', icon: '🖼️', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'anime', name: 'Anime', description: 'Anime and manga style artwork', icon: '🎨', recommendedStyle: 'anime', recommendedAspectRatio: '3:2' },
  { id: 'interior-design', name: 'Interior Design', description: 'Room and space visualization', icon: '🏠', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'real-estate', name: 'Real Estate', description: 'Property and architecture renders', icon: '🏢', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'fashion', name: 'Fashion', description: 'Fashion and apparel design', icon: '👗', recommendedStyle: 'portrait', recommendedAspectRatio: '9:16' },
  { id: 'character-design', name: 'Character Design', description: 'Character and OC concepts', icon: '🧙', recommendedStyle: 'fantasy', recommendedAspectRatio: '3:2' },
];

module.exports = {
  generateImage,
  generateVideo,
  retryGeneration,
  PRESETS,
  MEDIA_CREDIT_COSTS,
};
