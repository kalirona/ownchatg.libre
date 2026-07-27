const mongoose = require('mongoose');
const { logger, escapeRegExp } = require('@librechat/data-schemas');
const PromptFavorite = require('~/server/models/PromptFavorite');
const { getPrompts } = require('~/models');

const PAGE_SIZE = 24;

async function attachProductionPrompts(groups) {
  const Prompt = mongoose.models.Prompt;
  const uniqueIds = [
    ...new Set(groups.map((g) => g.productionId?.toString()).filter(Boolean)),
  ];
  if (uniqueIds.length === 0) {
    return groups.map((g) => ({ ...g, productionPrompt: null }));
  }
  const prompts = await Prompt.find({ _id: { $in: uniqueIds } }).select('prompt').lean();
  const promptMap = new Map(prompts.map((p) => [p._id.toString(), p]));
  return groups.map((g) => ({
    ...g,
    productionPrompt: g.productionId
      ? (promptMap.get(g.productionId.toString()) ?? null)
      : null,
  }));
}

async function getFavoriteIds(userId) {
  const favorites = await PromptFavorite.find({ user: userId })
    .select('groupId')
    .lean();
  return new Set(favorites.map((f) => f.groupId.toString()));
}

async function listPrompts(req, res) {
  try {
    const {
      search,
      category,
      sort = 'trending',
      page = 1,
    } = req.query;

    const filter = { isPublic: true };
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: escapeRegExp(search), $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * PAGE_SIZE;

    const sortOption = sort === 'newest'
      ? { createdAt: -1 }
      : { numberOfGenerations: -1, updatedAt: -1, _id: 1 };

    const PromptGroup = mongoose.model('PromptGroup');
    const [groups, total] = await Promise.all([
      PromptGroup.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(PAGE_SIZE)
        .select(
          'name numberOfGenerations oneliner category productionId author authorName createdAt updatedAt command',
        )
        .lean(),
      PromptGroup.countDocuments(filter),
    ]);

    const promptGroups = await attachProductionPrompts(groups);

    let favoriteIds = new Set();
    if (req.user) {
      favoriteIds = await getFavoriteIds(req.user.id);
    }

    const result = promptGroups.map((g) => ({
      ...g,
      _id: g._id.toString(),
      isFavorited: favoriteIds.has(g._id.toString()),
      author: g.author?.toString(),
    }));

    res.json({
      prompts: result,
      total,
      page: pageNum,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    logger.error('[Marketplace] listPrompts error:', error);
    res.status(500).json({ error: 'Failed to list prompts' });
  }
}

async function getFeatured(req, res) {
  try {
    const PromptGroup = mongoose.model('PromptGroup');
    const groups = await PromptGroup.find({ isPublic: true })
      .sort({ numberOfGenerations: -1, updatedAt: -1 })
      .limit(6)
      .select(
        'name numberOfGenerations oneliner category productionId author authorName createdAt updatedAt command',
      )
      .lean();

    const promptGroups = await attachProductionPrompts(groups);
    let favoriteIds = new Set();
    if (req.user) {
      favoriteIds = await getFavoriteIds(req.user.id);
    }

    const result = promptGroups.map((g) => ({
      ...g,
      _id: g._id.toString(),
      isFavorited: favoriteIds.has(g._id.toString()),
      author: g.author?.toString(),
    }));

    res.json({ prompts: result });
  } catch (error) {
    logger.error('[Marketplace] getFeatured error:', error);
    res.status(500).json({ error: 'Failed to get featured prompts' });
  }
}

async function getCategories(req, res) {
  try {
    const PromptGroup = mongoose.model('PromptGroup');
    const categories = await PromptGroup.distinct('category', {
      isPublic: true,
      category: { $exists: true, $ne: '' },
    });
    const counts = await Promise.all(
      categories.map(async (cat) => {
        const count = await PromptGroup.countDocuments({
          isPublic: true,
          category: cat,
        });
        return { name: cat, count };
      }),
    );
    res.json({ categories: counts });
  } catch (error) {
    logger.error('[Marketplace] getCategories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
}

async function toggleFavorite(req, res) {
  try {
    const { groupId } = req.params;
    const existing = await PromptFavorite.findOne({
      user: req.user.id,
      groupId,
    });
    if (existing) {
      await PromptFavorite.deleteOne({ _id: existing._id });
      res.json({ favorited: false });
    } else {
      await PromptFavorite.create({
        user: req.user.id,
        groupId,
        tenantId: req.user.tenantId,
      });
      res.json({ favorited: true });
    }
  } catch (error) {
    logger.error('[Marketplace] toggleFavorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

async function getFavorites(req, res) {
  try {
    const { page = 1 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * PAGE_SIZE;

    const PromptGroup = mongoose.model('PromptGroup');
    const favorites = await PromptFavorite.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate({
        path: 'groupId',
        select:
          'name numberOfGenerations oneliner category productionId author authorName createdAt updatedAt command',
      })
      .lean();

    const groups = favorites
      .map((f) => f.groupId)
      .filter(Boolean);

    const promptGroups = await attachProductionPrompts(groups);
    const total = await PromptFavorite.countDocuments({ user: req.user.id });

    const result = promptGroups.map((g) => ({
      ...g,
      _id: g._id.toString(),
      isFavorited: true,
      author: g.author?.toString(),
    }));

    res.json({
      prompts: result,
      total,
      page: pageNum,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    logger.error('[Marketplace] getFavorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
}

module.exports = {
  listPrompts,
  getFeatured,
  getCategories,
  toggleFavorite,
  getFavorites,
};
