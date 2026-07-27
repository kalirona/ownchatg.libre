const { logger } = require('@librechat/data-schemas');
const { saveBase64Image, processFileURL } = require('~/server/services/Files/process');
const { getFileStrategy } = require('~/server/utils/getFileStrategy');
const { FileContext } = require('librechat-data-provider');

const PROVIDERS = {
  fal: require('./providers/fal'),
  openrouter: require('./providers/openrouter'),
  flux: require('./providers/flux'),
  imagen: require('./providers/imagen'),
  ideogram: require('./providers/ideogram'),
};

const PROVIDER_META = {
  fal: { name: 'Fal AI', icon: '🎨' },
  openrouter: { name: 'OpenRouter', icon: '🔄' },
  flux: { name: 'Flux', icon: '✨' },
  imagen: { name: 'Imagen', icon: '🖼️' },
  ideogram: { name: 'Ideogram', icon: '🎯' },
};

function getModelsForProvider(providerKey) {
  const prov = PROVIDERS[providerKey];
  if (!prov || !prov.MODELS) {
    return [];
  }
  return prov.MODELS;
}

function getProviderList() {
  return Object.entries(PROVIDER_META).map(([key, meta]) => ({
    key,
    name: meta.name,
    icon: meta.icon,
    models: getModelsForProvider(key),
  }));
}

function getAspectRatios(providerKey) {
  const prov = PROVIDERS[providerKey];
  if (prov && prov.ASPECT_RATIOS) {
    return prov.ASPECT_RATIOS;
  }
  return ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
}

async function generateImage({ provider, model, prompt, negativePrompt, aspectRatio, seed, numImages, apiKey, req }) {
  const provImpl = PROVIDERS[provider];
  if (!provImpl) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const rawImages = await provImpl.generate({
    model,
    prompt,
    negativePrompt,
    aspectRatio,
    seed,
    numImages: numImages || 1,
    apiKey,
  });

  const savedImages = [];

  for (let i = 0; i < rawImages.length; i++) {
    const img = rawImages[i];
    let fileRecord;

    if (img.url && img.url.startsWith('data:')) {
      fileRecord = await saveBase64Image(img.url, {
        req,
        filename: `image-gen-${Date.now()}-${i}.png`,
        context: FileContext.image_generation,
      });
    } else if (img.url) {
      fileRecord = await processFileURL({
        fileStrategy: getFileStrategy(req.config, { isImage: true }),
        userId: req.user.id,
        URL: img.url,
        fileName: `image-gen-${Date.now()}-${i}.png`,
        basePath: 'images',
        context: FileContext.image_generation,
        tenantId: req.user.tenantId,
        req,
      });
    } else if (img.b64_json) {
      fileRecord = await saveBase64Image(`data:image/png;base64,${img.b64_json}`, {
        req,
        filename: `image-gen-${Date.now()}-${i}.png`,
        context: FileContext.image_generation,
      });
    }

    if (fileRecord) {
      savedImages.push({
        filepath: fileRecord.filepath,
        fileId: fileRecord.file_id,
        width: img.width || fileRecord.width,
        height: img.height || fileRecord.height,
      });
    }
  }

  return savedImages;
}

module.exports = {
  generateImage,
  getProviderList,
  getModelsForProvider,
  getAspectRatios,
  PROVIDER_META,
};
