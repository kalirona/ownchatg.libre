const { logger } = require('@librechat/data-schemas');
const MediaHistory = require('~/server/models/MediaHistory');
const MediaService = require('~/server/services/Media/MediaService');

async function getPresets(req, res) {
  res.json(MediaService.PRESETS);
}

async function getCreditCosts(req, res) {
  res.json(MediaService.MEDIA_CREDIT_COSTS);
}

async function generate(req, res) {
  const { type } = req.params;
  const body = req.body;

  if (!['image', 'video'].includes(type)) {
    return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video".' });
  }

  if (!body.prompt || !body.prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    let result;
    if (type === 'image') {
      result = await MediaService.generateImage({
        preset: body.preset,
        quality: body.quality || 'balanced',
        style: body.style || 'photo',
        aspectRatio: body.aspectRatio || '1:1',
        numImages: body.numImages || 1,
        prompt: body.prompt,
        negativePrompt: body.negativePrompt,
        seed: body.seed,
        cfg: body.cfg,
        steps: body.steps,
        req,
      });
    } else {
      result = await MediaService.generateVideo({
        preset: body.preset,
        quality: body.quality || 'standard',
        duration: body.duration || 5,
        aspectRatio: body.aspectRatio || '16:9',
        prompt: body.prompt,
        motionStrength: body.motionStrength || 'medium',
        cameraMotion: body.cameraMotion || 'static',
        negativePrompt: body.negativePrompt,
        seed: body.seed,
        req,
      });
    }

    res.json(result);
  } catch (error) {
    logger.error(`[MediaController] generate ${type} error:`, error);
    res.status(500).json({ error: error.message || `${type} generation failed` });
  }
}

async function getHistory(req, res) {
  const { page = 1, limit = 50, type, favorite, search } = req.query;

  try {
    const filter = { user: req.user.id };
    if (type && ['image', 'video'].includes(type)) {
      filter.type = type;
    }
    if (favorite === 'true') {
      filter.favorite = true;
    }
    if (search) {
      filter.prompt = { $regex: search, $options: 'i' };
    }

    const total = await MediaHistory.countDocuments(filter);
    const records = await MediaHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .select('-__v')
      .lean();

    res.json({ records, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (error) {
    logger.error('[MediaController] getHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function deleteHistoryEntry(req, res) {
  const { id } = req.params;

  try {
    const record = await MediaHistory.findOneAndDelete({ _id: id, user: req.user.id });
    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('[MediaController] deleteHistoryEntry error:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
}

async function toggleFavorite(req, res) {
  const { id } = req.params;

  try {
    const record = await MediaHistory.findOne({ _id: id, user: req.user.id });
    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    record.favorite = !record.favorite;
    await record.save();

    res.json({ favorite: record.favorite });
  } catch (error) {
    logger.error('[MediaController] toggleFavorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

async function retryGeneration(req, res) {
  const { id } = req.params;

  try {
    const result = await MediaService.retryGeneration(id, req);
    res.json(result);
  } catch (error) {
    logger.error('[MediaController] retryGeneration error:', error);
    res.status(500).json({ error: error.message || 'Retry failed' });
  }
}

async function cancelGeneration(req, res) {
  const { id } = req.params;

  try {
    const record = await MediaHistory.findOneAndUpdate(
      { _id: id, user: req.user.id, status: { $in: ['queued', 'preparing', 'generating'] } },
      { $set: { status: 'idle' } },
      { new: true },
    );
    if (!record) {
      return res.status(404).json({ error: 'Active generation not found' });
    }
    res.json({ message: 'Cancelled' });
  } catch (error) {
    logger.error('[MediaController] cancelGeneration error:', error);
    res.status(500).json({ error: 'Failed to cancel generation' });
  }
}

module.exports = {
  getPresets,
  getCreditCosts,
  generate,
  getHistory,
  deleteHistoryEntry,
  toggleFavorite,
  retryGeneration,
  cancelGeneration,
};
