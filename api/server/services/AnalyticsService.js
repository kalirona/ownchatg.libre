const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

function getPeriodFilter(period) {
  const now = new Date();
  let start;
  switch (period) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { $gte: start };
}

function dateBucket(format = '%Y-%m-%d') {
  return { $dateToString: { format, date: '$createdAt' } };
}

async function getUserGrowth(period) {
  try {
    const User = mongoose.models.User;
    if (!User) return { daily: [], totalUsers: 0, newUsers: 0 };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const totalUsers = await User.countDocuments({});
    const daily = await User.aggregate([
      { $match: filter },
      { $group: { _id: dateBucket(), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', value: '$count' } },
    ]);
    const newUsers = daily.reduce((sum, d) => sum + d.value, 0);
    return { daily, totalUsers, newUsers };
  } catch (err) {
    logger.error('[AnalyticsService] getUserGrowth', err);
    return { daily: [], totalUsers: 0, newUsers: 0 };
  }
}

async function getCreditUsage(period) {
  try {
    const Transaction = mongoose.models.Transaction;
    if (!Transaction) return { daily: [], creditTotal: { promptTokens: 0, completionTokens: 0, totalCost: 0 } };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const daily = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: dateBucket(),
          totalTokens: { $sum: { $ifNull: ['$tokenValue', 0] } },
          cost: { $sum: { $ifNull: ['$rawAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', value: '$cost' } },
    ]);
    const totalAgg = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          promptTokens: { $sum: { $cond: [{ $eq: ['$tokenType', 'prompt'] }, { $ifNull: ['$tokenValue', 0] }, 0] } },
          completionTokens: { $sum: { $cond: [{ $eq: ['$tokenType', 'completion'] }, { $ifNull: ['$tokenValue', 0] }, 0] } },
          cost: { $sum: { $ifNull: ['$rawAmount', 0] } },
        },
      },
    ]);
    const total = totalAgg[0] || {};
    return {
      daily,
      creditTotal: {
        promptTokens: total.promptTokens || 0,
        completionTokens: total.completionTokens || 0,
        totalCost: total.cost || 0,
      },
    };
  } catch (err) {
    logger.error('[AnalyticsService] getCreditUsage', err);
    return { daily: [], creditTotal: { promptTokens: 0, completionTokens: 0, totalCost: 0 } };
  }
}

async function getRevenue(period) {
  try {
    const PaymentTransaction = mongoose.models.PaymentTransaction;
    if (!PaymentTransaction) return { daily: [], revenueTotal: { amount: 0, creditsAwarded: 0, count: 0 } };
    const filter = period ? { createdAt: getPeriodFilter(period), status: 'completed' } : { status: 'completed' };
    const daily = await PaymentTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: dateBucket(),
          amount: { $sum: '$amount' },
          creditsAwarded: { $sum: '$creditsAwarded' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          value: '$amount',
        },
      },
    ]);
    const totalAgg = await PaymentTransaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          amount: { $sum: '$amount' },
          creditsAwarded: { $sum: '$creditsAwarded' },
          count: { $sum: 1 },
        },
      },
    ]);
    const total = totalAgg[0] || {};
    return {
      daily,
      revenueTotal: {
        amount: total.amount || 0,
        creditsAwarded: total.creditsAwarded || 0,
        count: total.count || 0,
      },
    };
  } catch (err) {
    logger.error('[AnalyticsService] getRevenue', err);
    return { daily: [], revenueTotal: { amount: 0, creditsAwarded: 0, count: 0 } };
  }
}

async function getModelUsage(period) {
  try {
    const Message = mongoose.models.Message;
    if (!Message) return [];
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const totalMessages = await Message.countDocuments(filter);
    if (totalMessages === 0) return [];
    const usage = await Message.aggregate([
      { $match: { ...filter, model: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { model: '$model', endpoint: { $ifNull: ['$endpoint', 'unknown'] } },
          count: { $sum: 1 },
          totalTokens: { $sum: { $ifNull: ['$tokenCount', 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          model: '$_id.model',
          endpoint: '$_id.endpoint',
          count: 1,
          totalTokens: 1,
        },
      },
    ]);
    return usage.map((item) => ({
      ...item,
      percentage: Math.round((item.count / totalMessages) * 10000) / 100,
    }));
  } catch (err) {
    logger.error('[AnalyticsService] getModelUsage', err);
    return [];
  }
}

async function getUserActivity(period) {
  try {
    const Message = mongoose.models.Message;
    if (!Message) return { daily: [], activityTotal: { activeUsers: 0, totalMessages: 0 } };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const totalMessages = await Message.countDocuments(filter);
    const activeUserAgg = await Message.distinct('user', filter);
    const daily = await Message.aggregate([
      { $match: filter },
      {
        $group: {
          _id: dateBucket(),
          messages: { $sum: 1 },
          users: { $addToSet: '$user' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          value: '$messages',
        },
      },
    ]);
    return {
      daily,
      activityTotal: {
        activeUsers: activeUserAgg.length,
        totalMessages,
      },
    };
  } catch (err) {
    logger.error('[AnalyticsService] getUserActivity', err);
    return { daily: [], activityTotal: { activeUsers: 0, totalMessages: 0 } };
  }
}

async function getRetention(period) {
  try {
    const UserSubscription = mongoose.models.UserSubscription;
    if (!UserSubscription) return { daily: [], retentionCurrent: { activeSubscriptions: 0, churnRate: 0 } };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const activeCount = await UserSubscription.countDocuments({ status: 'active' });
    const daily = await UserSubscription.aggregate([
      { $match: filter },
      {
        $group: {
          _id: dateBucket(),
          newSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          canceledSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          value: { $subtract: ['$newSubscriptions', '$canceledSubscriptions'] },
        },
      },
    ]);
    const canceledCount = await UserSubscription.countDocuments({ status: 'canceled' });
    const totalSubs = activeCount + canceledCount;
    const churnRate = totalSubs > 0 ? Math.round((canceledCount / totalSubs) * 10000) / 100 : 0;
    return {
      daily,
      retentionCurrent: {
        activeSubscriptions: activeCount,
        churnRate,
      },
    };
  } catch (err) {
    logger.error('[AnalyticsService] getRetention', err);
    return { daily: [], retentionCurrent: { activeSubscriptions: 0, churnRate: 0 } };
  }
}

async function getImageStats(period) {
  try {
    const ImageGenHistory = mongoose.models.ImageGenHistory;
    if (!ImageGenHistory) return { totalGenerated: 0, byProvider: [], daily: [] };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const totalGenerated = await ImageGenHistory.countDocuments(filter);
    const byProvider = await ImageGenHistory.aggregate([
      { $match: filter },
      { $group: { _id: '$provider', count: { $sum: 1 } } },
      { $project: { _id: 0, provider: '$_id', count: 1 } },
    ]);
    const daily = await ImageGenHistory.aggregate([
      { $match: filter },
      { $group: { _id: dateBucket(), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', value: '$count' } },
    ]);
    return { totalGenerated, byProvider, daily };
  } catch (err) {
    logger.error('[AnalyticsService] getImageStats', err);
    return { totalGenerated: 0, byProvider: [], daily: [] };
  }
}

async function getVideoStats(period) {
  try {
    const VideoGenHistory = mongoose.models.VideoGenHistory;
    if (!VideoGenHistory) return { totalGenerated: 0, byProvider: [], daily: [] };
    const filter = period ? { createdAt: getPeriodFilter(period) } : {};
    const totalGenerated = await VideoGenHistory.countDocuments(filter);
    const byProvider = await VideoGenHistory.aggregate([
      { $match: filter },
      { $group: { _id: '$provider', count: { $sum: 1 } } },
      { $project: { _id: 0, provider: '$_id', count: 1 } },
    ]);
    const daily = await VideoGenHistory.aggregate([
      { $match: filter },
      { $group: { _id: dateBucket(), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', value: '$count' } },
    ]);
    return { totalGenerated, byProvider, daily };
  } catch (err) {
    logger.error('[AnalyticsService] getVideoStats', err);
    return { totalGenerated: 0, byProvider: [], daily: [] };
  }
}

async function getAnalytics(period) {
  const [userGrowth, creditUsage, revenue, modelUsage, userActivity, retention, imageStats, videoStats] =
    await Promise.all([
      getUserGrowth(period),
      getCreditUsage(period),
      getRevenue(period),
      getModelUsage(period),
      getUserActivity(period),
      getRetention(period),
      getImageStats(period),
      getVideoStats(period),
    ]);
  return { userGrowth, creditUsage, revenue, modelUsage, userActivity, retention, imageStats, videoStats };
}

module.exports = { getAnalytics };
