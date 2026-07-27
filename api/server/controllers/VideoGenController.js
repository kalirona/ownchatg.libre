const { logger } = require('@librechat/data-schemas');
const VideoGenHistory = require('~/server/models/VideoGenHistory');
const VideoGenService = require('~/server/services/VideoGen/VideoGenService');

async function getProviders(req, res) {
  try {
    const providers = VideoGenService.getProviderList();
    res.json(providers);
  } catch (error) {
    logger.error('[VideoGen] getProviders error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
}

async function getDurationLimits(req, res) {
  const { provider, model } = req.query;

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  try {
    const limits = VideoGenService.getDurationLimits(provider, model);
    res.json(limits);
  } catch (error) {
    logger.error('[VideoGen] getDurationLimits error:', error);
    res.status(500).json({ error: 'Failed to get duration limits' });
  }
}

async function generate(req, res) {
  const { provider, model, prompt, duration, aspectRatio, quality } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const historyRecord = await VideoGenHistory.create({
      user: req.user.id,
      provider,
      model: model || '',
      prompt,
      duration: duration || 5,
      aspectRatio: aspectRatio || '16:9',
      quality: quality || 'standard',
      status: 'processing',
      tenantId: req.user.tenantId,
    });

    const videos = await VideoGenService.generateVideo({
      provider,
      model,
      prompt,
      duration,
      aspectRatio,
      quality,
      req,
    });

    historyRecord.videos = videos;
    historyRecord.status = 'completed';
    await historyRecord.save();

    res.json({
      videos,
      historyId: historyRecord._id,
      status: 'completed',
    });
  } catch (error) {
    logger.error('[VideoGen] generate error:', error);

    try {
      await VideoGenHistory.findOneAndUpdate(
        { _id: historyRecord?._id, user: req.user.id },
        { status: 'failed', error: error.message },
      );
    } catch (dbError) {
      logger.error('[VideoGen] Failed to update error status:', dbError);
    }

    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
}

async function getHistory(req, res) {
  const { page = 1, limit = 50, status, favorite } = req.query;

  try {
    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }
    if (favorite === 'true') {
      filter.favorite = true;
    }

    const total = await VideoGenHistory.countDocuments(filter);
    const records = await VideoGenHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .lean();

    res.json({ records, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (error) {
    logger.error('[VideoGen] getHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function getStatus(req, res) {
  const { id } = req.params;

  try {
    const record = await VideoGenHistory.findOne({ _id: id, user: req.user.id }).lean();

    if (!record) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json({
      status: record.status,
      videos: record.videos || [],
      error: record.error || null,
    });
  } catch (error) {
    logger.error('[VideoGen] getStatus error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
}

async function deleteHistoryEntry(req, res) {
  const { id } = req.params;

  try {
    const record = await VideoGenHistory.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('[VideoGen] deleteHistoryEntry error:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
}

async function toggleFavorite(req, res) {
  const { id } = req.params;

  try {
    const record = await VideoGenHistory.findOne({ _id: id, user: req.user.id });

    if (!record) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    record.favorite = !record.favorite;
    await record.save();

    res.json({ favorite: record.favorite });
  } catch (error) {
    logger.error('[VideoGen] toggleFavorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

module.exports = {
  getProviders,
  getDurationLimits,
  generate,
  getHistory,
  getStatus,
  deleteHistoryEntry,
  toggleFavorite,
};
