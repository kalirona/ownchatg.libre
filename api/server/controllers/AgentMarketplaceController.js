const service = require('~/server/services/AgentMarketplaceService');
const { logger } = require('@librechat/data-schemas');

/* ── Listings ──────────────────────────────────────────────── */

const list = async (req, res) => {
  try {
    const { search, category, tags, sort, page, sellerId, status, featured } = req.query;
    const result = await service.listListings({
      search, category, tags: tags ? tags.split(',') : undefined, sort, page,
      sellerId: sellerId || req.user?.id,
      status: status || (sellerId ? undefined : 'active'),
      featured: featured === 'true',
    });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] list error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const listing = await service.getListing(req.params.id, req.user?.id);
    if (!listing) { return res.status(404).json({ status: 'error', message: 'Listing not found' }); }
    res.json({ status: 'ok', listing });
  } catch (err) {
    logger.error('[AgentMarketplace] getById error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, shortDescription, category, tags, price, agentConfig, isFree, previewImage, compatibleEndpoints, requiredKeys } = req.body;
    if (!name) { return res.status(400).json({ status: 'error', message: 'Name is required' }); }

    const listing = await service.createListing({
      sellerId: req.user.id,
      sellerName: req.user.name || req.user.username || 'Unknown',
      name, description, shortDescription, category, tags, price, agentConfig, isFree, previewImage, compatibleEndpoints, requiredKeys,
    });
    res.status(201).json({ status: 'ok', listing });
  } catch (err) {
    logger.error('[AgentMarketplace] create error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const listing = await service.updateListing(req.params.id, req.user.id, req.body);
    if (!listing) { return res.status(404).json({ status: 'error', message: 'Listing not found or not yours' }); }
    res.json({ status: 'ok', listing });
  } catch (err) {
    logger.error('[AgentMarketplace] update error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await service.deleteListing(req.params.id, req.user.id);
    if (!deleted) { return res.status(404).json({ status: 'error', message: 'Listing not found or not yours' }); }
    res.json({ status: 'ok', deleted: true });
  } catch (err) {
    logger.error('[AgentMarketplace] remove error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/* ── Installation ──────────────────────────────────────────── */

const install = async (req, res) => {
  try {
    const result = await service.installListing(req.params.id, req.user.id, req.user.name);
    if (result.error) { return res.status(400).json({ status: 'error', message: result.error }); }
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] install error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const uninstall = async (req, res) => {
  try {
    const result = await service.uninstallListing(req.params.id, req.user.id);
    res.json({ status: 'ok', uninstalled: result });
  } catch (err) {
    logger.error('[AgentMarketplace] uninstall error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getInstalled = async (req, res) => {
  try {
    const agents = await service.getInstalledAgents(req.user.id);
    res.json({ status: 'ok', agents });
  } catch (err) {
    logger.error('[AgentMarketplace] getInstalled error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/* ── Reviews ───────────────────────────────────────────────── */

const createReview = async (req, res) => {
  try {
    const { rating, title, review, pros, cons } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
    }
    const result = await service.createReview({
      listingId: req.params.id, userId: req.user.id, rating, title, review, pros, cons,
    });
    if (result.error) { return res.status(400).json({ status: 'error', message: result.error }); }
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] createReview error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const result = await service.getReviews(req.params.id, { page: req.query.page });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] getReviews error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/* ── Follows ───────────────────────────────────────────────── */

const follow = async (req, res) => {
  try {
    const result = await service.followCreator(req.user.id, req.params.userId);
    if (result.error) { return res.status(400).json({ status: 'error', message: result.error }); }
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] follow error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const unfollow = async (req, res) => {
  try {
    const result = await service.unfollowCreator(req.user.id, req.params.userId);
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] unfollow error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const result = await service.getFollowers(req.params.userId, { page: req.query.page });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] getFollowers error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const result = await service.getFollowing(req.user.id, { page: req.query.page });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] getFollowing error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/* ── Revenue ───────────────────────────────────────────────── */

const getRevenue = async (req, res) => {
  try {
    const result = await service.getSellerRevenue(req.user.id, { status: req.query.status });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('[AgentMarketplace] getRevenue error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/* ── Creator Profile ───────────────────────────────────────── */

const getCreatorProfile = async (req, res) => {
  try {
    const profile = await service.getCreatorProfile(req.params.userId);
    res.json({ status: 'ok', ...profile });
  } catch (err) {
    logger.error('[AgentMarketplace] getCreatorProfile error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  list, getById, create, update, remove,
  install, uninstall, getInstalled,
  createReview, getReviews,
  follow, unfollow, getFollowers, getFollowing,
  getRevenue, getCreatorProfile,
};
