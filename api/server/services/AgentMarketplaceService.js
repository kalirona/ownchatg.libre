const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

const AgentListing = require('~/server/models/AgentListing');
const AgentPurchase = require('~/server/models/AgentPurchase');
const AgentReview = require('~/server/models/AgentReview');
const CreatorFollow = require('~/server/models/CreatorFollow');
const AgentRevenue = require('~/server/models/AgentRevenue');

const PAGE_SIZE = 20;

/* ── Listings ──────────────────────────────────────────────── */

async function listListings({ search, category, tags, sort, page = 1, sellerId, status, featured } = {}) {
  const filter = {};
  if (sellerId) { filter.seller = sellerId; }
  if (status) { filter.status = status; } else if (!sellerId) { filter.status = 'active'; }
  if (category) { filter.category = category; }
  if (tags && tags.length > 0) { filter.tags = { $in: tags }; }
  if (featured) { filter.featured = true; }

  if (search) {
    filter.$text = { $search: search };
  }

  let sortOption = { ratingAvg: -1, installCount: -1 };
  if (sort === 'newest') { sortOption = { createdAt: -1 }; }
  else if (sort === 'price_low') { sortOption = { price: 1 }; }
  else if (sort === 'price_high') { sortOption = { price: -1 }; }
  else if (sort === 'rating') { sortOption = { ratingAvg: -1 }; }
  else if (sort === 'installs') { sortOption = { installCount: -1 }; }
  else if (sort === 'name') { sortOption = { name: 1 }; }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const [listings, total] = await Promise.all([
    AgentListing.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(PAGE_SIZE)
      .select('-agentConfig.instructions -changelog')
      .lean(),
    AgentListing.countDocuments(filter),
  ]);

  return {
    listings,
    total,
    page: pageNum,
    pages: Math.ceil(total / PAGE_SIZE),
  };
}

async function getListing(listingId, userId) {
  const listing = await AgentListing.findById(listingId).lean();
  if (!listing) { return null; }

  let isInstalled = false;
  let isOwner = false;

  if (userId) {
    isOwner = listing.seller.toString() === userId.toString();
    const purchase = await AgentPurchase.findOne({ listing: listingId, buyer: userId, status: 'completed' }).lean();
    isInstalled = !!purchase;
  }

  return { ...listing, isInstalled, isOwner };
}

async function createListing({ sellerId, sellerName, name, description, shortDescription, category, tags, price, agentConfig, isFree, previewImage, compatibleEndpoints, requiredKeys } = {}) {
  const listing = await AgentListing.create({
    name,
    description,
    shortDescription: shortDescription || description?.slice(0, 200),
    category: category || 'general',
    tags: tags || [],
    price: price || 0,
    seller: sellerId,
    sellerName,
    agentConfig: agentConfig || {},
    isFree: isFree !== undefined ? isFree : (price === 0 || !price),
    previewImage,
    compatibleEndpoints: compatibleEndpoints || [],
    requiredKeys: requiredKeys || [],
  });

  return listing.toObject();
}

async function updateListing(listingId, sellerId, updates) {
  const listing = await AgentListing.findOne({ _id: listingId, seller: sellerId });
  if (!listing) { return null; }

  const allowedFields = ['name', 'description', 'shortDescription', 'category', 'tags', 'price', 'agentConfig', 'isFree', 'status', 'previewImage', 'demoUrl', 'compatibleEndpoints', 'requiredKeys'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      listing[field] = updates[field];
    }
  }

  await listing.save();
  return listing.toObject();
}

async function deleteListing(listingId, sellerId) {
  const listing = await AgentListing.findOneAndDelete({ _id: listingId, seller: sellerId });
  if (!listing) { return false; }

  await AgentReview.deleteMany({ listing: listingId });
  return true;
}

/* ── Installation ──────────────────────────────────────────── */

async function installListing(listingId, buyerId, buyerName) {
  const listing = await AgentListing.findById(listingId);
  if (!listing) { return { error: 'Listing not found' }; }
  if (listing.status !== 'active') { return { error: 'Listing is not active' }; }

  const existing = await AgentPurchase.findOne({ listing: listingId, buyer: buyerId });
  if (existing) {
    if (existing.status === 'completed') {
      return { error: 'Already installed' };
    }
    existing.status = 'completed';
    existing.installedAt = new Date();
    await existing.save();

    listing.installCount = (listing.installCount || 0) + 1;
    await listing.save();
    return { success: true, installed: true };
  }

  const purchase = await AgentPurchase.create({
    listing: listingId,
    buyer: buyerId,
    seller: listing.seller,
    price: listing.price,
    status: 'completed',
    installedAt: new Date(),
  });

  if (!listing.isFree && listing.price > 0) {
    const platformFee = listing.price * (1 - listing.revenueShare);
    await AgentRevenue.create({
      listing: listingId,
      purchase: purchase._id,
      seller: listing.seller,
      amount: listing.price,
      platformFee: Math.round(platformFee * 100) / 100,
      sellerPayout: listing.price * listing.revenueShare,
      status: 'pending',
    });
  }

  listing.installCount = (listing.installCount || 0) + 1;
  await listing.save();

  return { success: true, installed: true };
}

async function uninstallListing(listingId, buyerId) {
  const purchase = await AgentPurchase.findOneAndUpdate(
    { listing: listingId, buyer: buyerId, status: 'completed' },
    { status: 'refunded' },
  );
  if (!purchase) { return false; }

  await AgentListing.findByIdAndUpdate(listingId, { $inc: { installCount: -1 } });
  return true;
}

/* ── Reviews ───────────────────────────────────────────────── */

async function createReview({ listingId, userId, rating, title, review, pros, cons }) {
  const hasPurchased = await AgentPurchase.findOne({ listing: listingId, buyer: userId, status: 'completed' });
  if (!hasPurchased) {
    return { error: 'You must install this agent before reviewing' };
  }

  const existing = await AgentReview.findOne({ listing: listingId, user: userId });
  if (existing) {
    return { error: 'You have already reviewed this agent' };
  }

  await AgentReview.create({ listing: listingId, user: userId, rating, title, review, pros, cons });

  const stats = await AgentReview.aggregate([
    { $match: { listing: new mongoose.Types.ObjectId(listingId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await AgentListing.findByIdAndUpdate(listingId, {
      ratingAvg: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  return { success: true };
}

async function getReviews(listingId, { page = 1 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * 10;

  const [reviews, total] = await Promise.all([
    AgentReview.find({ listing: listingId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(10)
      .populate('user', 'name username avatar')
      .lean(),
    AgentReview.countDocuments({ listing: listingId }),
  ]);

  return { reviews, total, page: pageNum, pages: Math.ceil(total / 10) };
}

/* ── Follows ───────────────────────────────────────────────── */

async function followCreator(followerId, followingId) {
  if (followerId.toString() === followingId.toString()) {
    return { error: 'Cannot follow yourself' };
  }

  const existing = await CreatorFollow.findOne({ follower: followerId, following: followingId });
  if (existing) { return { error: 'Already following' }; }

  await CreatorFollow.create({ follower: followerId, following: followingId });
  return { success: true, following: true };
}

async function unfollowCreator(followerId, followingId) {
  const result = await CreatorFollow.findOneAndDelete({ follower: followerId, following: followingId });
  return { success: !!result, following: false };
}

async function getFollowers(userId, { page = 1 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * 20;

  const [follows, total] = await Promise.all([
    CreatorFollow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(20)
      .populate('follower', 'name username avatar')
      .lean(),
    CreatorFollow.countDocuments({ following: userId }),
  ]);

  return { followers: follows.map((f) => f.follower), total, page: pageNum, pages: Math.ceil(total / 20) };
}

async function getFollowing(userId, { page = 1 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * 20;

  const [follows, total] = await Promise.all([
    CreatorFollow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(20)
      .populate('following', 'name username avatar')
      .lean(),
    CreatorFollow.countDocuments({ follower: userId }),
  ]);

  return { following: follows.map((f) => f.following), total, page: pageNum, pages: Math.ceil(total / 20) };
}

/* ── Revenue ───────────────────────────────────────────────── */

async function getSellerRevenue(sellerId, { status } = {}) {
  const filter = { seller: sellerId };
  if (status) { filter.status = status; }

  const [revenue, totals] = await Promise.all([
    AgentRevenue.find(filter).sort({ createdAt: -1 }).populate('listing', 'name').lean(),
    AgentRevenue.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayout: { $sum: '$sellerPayout' },
          totalFees: { $sum: '$platformFee' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    revenue,
    summary: totals[0] || { totalAmount: 0, totalPayout: 0, totalFees: 0, count: 0 },
  };
}

/* ── Creator Profile ───────────────────────────────────────── */

async function getCreatorProfile(userId) {
  const [listings, followerCount, followingCount, revenue] = await Promise.all([
    AgentListing.find({ seller: userId, status: 'active' }).select('name shortDescription ratingAvg reviewCount installCount price isFree category createdAt').lean(),
    CreatorFollow.countDocuments({ following: userId }),
    CreatorFollow.countDocuments({ follower: userId }),
    AgentRevenue.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(userId), status: 'paid' } },
      { $group: { _id: null, totalEarned: { $sum: '$sellerPayout' } } },
    ]),
  ]);

  return {
    listings,
    followerCount,
    followingCount,
    totalEarned: revenue[0]?.totalEarned || 0,
  };
}

/* ── User's Installed Agents ───────────────────────────────── */

async function getInstalledAgents(userId) {
  const purchases = await AgentPurchase.find({ buyer: userId, status: 'completed' })
    .populate('listing')
    .sort({ installedAt: -1 })
    .lean();

  return purchases.map((p) => ({
    purchaseId: p._id,
    installedAt: p.installedAt,
    listing: p.listing,
  }));
}

module.exports = {
  listListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  installListing,
  uninstallListing,
  createReview,
  getReviews,
  followCreator,
  unfollowCreator,
  getFollowers,
  getFollowing,
  getSellerRevenue,
  getCreatorProfile,
  getInstalledAgents,
};
