const { logger } = require('@librechat/data-schemas');
const { saveBase64Image, processFileURL } = require('~/server/services/Files/process');
const { getFileStrategy } = require('~/server/utils/getFileStrategy');
const { FileContext } = require('librechat-data-provider');

const PROVIDERS = {
  fal: require('./providers/fal'),
  runway: require('./providers/runway'),
  veo: require('./providers/veo'),
  luma: require('./providers/luma'),
};

const PROVIDER_META = {
  fal: { name: 'Fal AI', icon: '🎬' },
  runway: { name: 'Runway', icon: '🎥' },
  veo: { name: 'Veo', icon: '📹' },
  luma: { name: 'Luma', icon: '✨' },
};

function getModelsForProvider(providerKey) {
  const prov = PROVIDERS[providerKey];
  if (!prov || !prov.MODELS) {
    return [];
  }
  return prov.MODELS;
}

function getDurationLimits(providerKey, modelId) {
  const prov = PROVIDERS[providerKey];
  if (!prov || !prov.DURATION_LIMITS) {
    return { min: 5, max: 10 };
  }
  return prov.DURATION_LIMITS[modelId] || { min: 5, max: 10 };
}

function getProviderList() {
  return Object.entries(PROVIDER_META).map(([key, meta]) => ({
    key,
    name: meta.name,
    icon: meta.icon,
    models: getModelsForProvider(key),
  }));
}

async function generateVideo({ provider, model, prompt, duration, aspectRatio, quality, apiKey, req }) {
  const provImpl = PROVIDERS[provider];
  if (!provImpl) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const rawVideos = await provImpl.generate({
    model,
    prompt,
    duration: duration || 5,
    aspectRatio: aspectRatio || '16:9',
    quality: quality || 'standard',
    apiKey,
  });

  const savedVideos = [];

  for (let i = 0; i < rawVideos.length; i++) {
    const vid = rawVideos[i];
    let fileRecord;

    if (vid.url && vid.url.startsWith('data:')) {
      fileRecord = await saveBase64Image(vid.url, {
        req,
        filename: `video-gen-${Date.now()}-${i}.mp4`,
        context: FileContext.image_generation,
      });
    } else if (vid.url) {
      fileRecord = await processFileURL({
        fileStrategy: getFileStrategy(req.config, { isImage: false }),
        userId: req.user.id,
        URL: vid.url,
        fileName: `video-gen-${Date.now()}-${i}.mp4`,
        basePath: 'images',
        context: FileContext.image_generation,
        tenantId: req.user.tenantId,
        req,
      });
    } else if (vid.b64_json) {
      fileRecord = await saveBase64Image(`data:video/mp4;base64,${vid.b64_json}`, {
        req,
        filename: `video-gen-${Date.now()}-${i}.mp4`,
        context: FileContext.image_generation,
      });
    }

    if (fileRecord) {
      savedVideos.push({
        filepath: fileRecord.filepath,
        fileId: fileRecord.file_id,
        width: vid.width || fileRecord.width,
        height: vid.height || fileRecord.height,
        duration: vid.duration || duration || 5,
      });
    }
  }

  return savedVideos;
}

module.exports = {
  generateVideo,
  getProviderList,
  getModelsForProvider,
  getDurationLimits,
  PROVIDER_META,
};
