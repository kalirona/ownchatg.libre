const { logger } = require('@librechat/data-schemas');
const ImageGenHistory = require('~/server/models/ImageGenHistory');
const ImageGenService = require('~/server/services/ImageGen/ImageGenService');

async function getProviders(req, res) {
  try {
    const providers = ImageGenService.getProviderList();
    const enriched = providers.map((p) => ({
      ...p,
      aspectRatios: ImageGenService.getAspectRatios(p.key),
    }));
    res.json(enriched);
  } catch (error) {
    logger.error('[ImageGen] getProviders error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
}

async function generate(req, res) {
  const { provider, model, prompt, negativePrompt, aspectRatio, seed, numImages } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const images = await ImageGenService.generateImage({
      provider,
      model,
      prompt,
      negativePrompt,
      aspectRatio,
      seed,
      numImages,
      req,
    });

    const historyRecord = await ImageGenHistory.create({
      user: req.user.id,
      provider,
      model: model || '',
      prompt,
      negativePrompt: negativePrompt || '',
      aspectRatio: aspectRatio || '',
      seed: seed != null ? seed : null,
      numImages: numImages || 1,
      images,
      tenantId: req.user.tenantId,
    });

    res.json({ images, historyId: historyRecord._id });
  } catch (error) {
    logger.error('[ImageGen] generate error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
}

async function getHistory(req, res) {
  const { page = 1, limit = 50, favorite } = req.query;

  try {
    const filter = { user: req.user.id };
    if (favorite === 'true') {
      filter.favorite = true;
    }

    const total = await ImageGenHistory.countDocuments(filter);
    const records = await ImageGenHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .lean();

    res.json({ records, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (error) {
    logger.error('[ImageGen] getHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function deleteHistoryEntry(req, res) {
  const { id } = req.params;

  try {
    const record = await ImageGenHistory.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('[ImageGen] deleteHistoryEntry error:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
}

async function toggleFavorite(req, res) {
  const { id } = req.params;

  try {
    const record = await ImageGenHistory.findOne({ _id: id, user: req.user.id });

    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    record.favorite = !record.favorite;
    await record.save();

    res.json({ favorite: record.favorite });
  } catch (error) {
    logger.error('[ImageGen] toggleFavorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

module.exports = {
  getProviders,
  generate,
  getHistory,
  deleteHistoryEntry,
  toggleFavorite,
};
