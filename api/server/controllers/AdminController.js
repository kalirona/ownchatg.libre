const mongoose = require('mongoose');
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const { getAppConfig, loadConfigModels } = require('~/server/services/Config');
const loginProtection = require('~/server/services/LoginProtectionService');

const db = require('~/models');

const Banner = mongoose.models.Banner;
const UserSubscription = mongoose.models.UserSubscription;
const PaymentTransaction = mongoose.models.PaymentTransaction;
const Balance = mongoose.models.Balance;
const Transaction = mongoose.models.Transaction;

async function getDashboardStats(req, res) {
  try {
    const [totalUsers, totalSubscriptions, recentPayments, balanceAgg] =
      await Promise.all([
        db.countUsers({}),
        UserSubscription.countDocuments({ status: 'active' }),
        PaymentTransaction.find({}).sort({ createdAt: -1 }).limit(10).lean(),
        Balance.aggregate([
          { $group: { _id: null, total: { $sum: '$tokenCredits' }, count: { $sum: 1 } } },
        ]),
      ]);

    const totalRevenue = recentPayments.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalCreditsAwarded = recentPayments.reduce(
      (sum, tx) => sum + (tx.creditsAwarded || 0),
      0,
    );

    res.json({
      totalUsers,
      activeSubscriptions: totalSubscriptions,
      totalRevenue,
      totalCreditsAwarded,
      totalBalanceOutstanding: balanceAgg[0]?.total ?? 0,
      balanceAccountCount: balanceAgg[0]?.count ?? 0,
      recentTransactions: recentPayments,
    });
  } catch (error) {
    logger.error('[AdminController] getDashboardStats', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
}

async function getUserDetail(req, res) {
  try {
    const user = await db.findUser({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const [balance, subscriptions, recentTx] = await Promise.all([
      db.findBalanceByUser(req.params.id),
      UserSubscription.find({ user: req.params.id }).sort({ createdAt: -1 }).lean(),
      PaymentTransaction.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);
    res.json({ user, balance, subscriptions, recentTransactions: recentTx });
  } catch (error) {
    logger.error('[AdminController] getUserDetail', error);
    res.status(500).json({ message: 'Error fetching user detail' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!role || ![SystemRoles.ADMIN, SystemRoles.USER].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be ADMIN or USER' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }
    const user = await db.findUser({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const updatedUser = await db.updateUser({ _id: req.params.id }, { role });
    res.json({ user: updatedUser });
  } catch (error) {
    logger.error('[AdminController] updateUserRole', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
}

async function adjustCredits(req, res) {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || amount == null || isNaN(amount)) {
      return res.status(400).json({ message: 'userId and amount are required' });
    }
    if (amount === 0) {
      return res.status(400).json({ message: 'Amount must be non-zero' });
    }
    const user = await db.findUser({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const balance = await db.updateBalance({ user: userId, incrementValue: amount });
    await Transaction.create({
      user: userId,
      tokenType: 'credits',
      tokenValue: amount,
      rawAmount: amount,
      context: reason || 'admin_adjustment',
    });
    res.json({ balance });
  } catch (error) {
    logger.error('[AdminController] adjustCredits', error);
    res.status(500).json({ message: 'Error adjusting credits' });
  }
}

async function getRevenue(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [transactions, total, aggregation] = await Promise.all([
      PaymentTransaction.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentTransaction.countDocuments({}),
      PaymentTransaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalCreditsAwarded: { $sum: '$creditsAwarded' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = aggregation[0] || { totalRevenue: 0, totalCreditsAwarded: 0, count: 0 };
    res.json({
      transactions,
      stats: {
        totalRevenue: stats.totalRevenue,
        totalCreditsAwarded: stats.totalCreditsAwarded,
        completedCount: stats.count,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('[AdminController] getRevenue', error);
    res.status(500).json({ message: 'Error fetching revenue' });
  }
}

async function getSubscriptions(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [subscriptions, total, activeCount] = await Promise.all([
      UserSubscription.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserSubscription.countDocuments({}),
      UserSubscription.countDocuments({ status: 'active' }),
    ]);

    res.json({
      subscriptions,
      stats: { total, active: activeCount, canceled: total - activeCount },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('[AdminController] getSubscriptions', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
}

async function cancelSubscription(req, res) {
  try {
    const subscription = await db.cancelUserSubscription(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json({ subscription });
  } catch (error) {
    logger.error('[AdminController] cancelSubscription', error);
    res.status(500).json({ message: 'Error canceling subscription' });
  }
}

async function getProviders(req, res) {
  try {
    const appConfig = await getAppConfig();
    const endpointConfig = appConfig.endpoints ?? {};
    const providers = Object.entries(endpointConfig).map(([key, value]) => ({
      name: key,
      enabled: value?.enabled !== false,
      available: Boolean(
        value?.userProvide ?? value?.baseURL ?? process.env[`${key.toUpperCase()}_API_KEY`],
      ),
      config: value ?? {},
    }));
    res.json({ providers });
  } catch (error) {
    logger.error('[AdminController] getProviders', error);
    res.status(500).json({ message: 'Error fetching providers' });
  }
}

async function getModels(req, res) {
  try {
    const models = await loadConfigModels();
    res.json({ models });
  } catch (error) {
    logger.error('[AdminController] getModels', error);
    res.status(500).json({ message: 'Error fetching models' });
  }
}

async function getAnnouncements(req, res) {
  try {
    const announcements = await Banner.find({}).sort({ displayFrom: -1 }).lean();
    res.json({ announcements });
  } catch (error) {
    logger.error('[AdminController] getAnnouncements', error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
}

async function createAnnouncement(req, res) {
  try {
    const { bannerId, message, type, displayFrom, displayTo, isPublic } = req.body;
    if (!bannerId || !message) {
      return res.status(400).json({ message: 'bannerId and message are required' });
    }
    const announcement = await Banner.create({
      bannerId,
      message,
      type: type || 'banner',
      displayFrom: displayFrom || new Date(),
      displayTo: displayTo || null,
      isPublic: isPublic != null ? isPublic : true,
    });
    res.status(201).json({ announcement });
  } catch (error) {
    logger.error('[AdminController] createAnnouncement', error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
}

async function updateAnnouncement(req, res) {
  try {
    const announcement = await Banner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    ).lean();
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ announcement });
  } catch (error) {
    logger.error('[AdminController] updateAnnouncement', error);
    res.status(500).json({ message: 'Error updating announcement' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const result = await Banner.findByIdAndDelete(req.params.id).lean();
    if (!result) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    logger.error('[AdminController] deleteAnnouncement', error);
    res.status(500).json({ message: 'Error deleting announcement' });
  }
}

async function getSystemHealth(req, res) {
  try {
    const mongoState = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const statuses = {
      mongodb: mongoState === 1 ? 'healthy' : 'unhealthy',
      server: 'healthy',
    };
    const allHealthy = Object.values(statuses).every((s) => s === 'healthy');
    res.json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks: {
        mongodb: { status: statuses.mongodb, state: stateMap[mongoState] },
        server: { status: statuses.server },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[AdminController] getSystemHealth', error);
    res.status(500).json({ message: 'Error checking system health' });
  }
}

async function getLockedUsers(req, res) {
  try {
    const users = await loginProtection.getLockedUsers();
    res.json({ users });
  } catch (error) {
    logger.error('[AdminController] getLockedUsers', error);
    res.status(500).json({ message: 'Error fetching locked users' });
  }
}

async function unlockUser(req, res) {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    await loginProtection.unlockAccount(id, adminUserId, ip, {
      requestId: req.headers['x-request-id'],
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('[AdminController] unlockUser', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Error unlocking user' });
  }
}

async function getFeatureFlags(req, res) {
  try {
    const appConfig = await getAppConfig();
    res.json({
      features: {
        balance: appConfig.balance?.enabled ?? false,
        billing: appConfig.billing?.enabled ?? false,
        registration: appConfig.registration?.enabled ?? true,
        socialLogin: appConfig.socialLogin?.enabled ?? false,
        rateLimit: appConfig.rateLimit?.enabled ?? true,
      },
    });
  } catch (error) {
    logger.error('[AdminController] getFeatureFlags', error);
    res.status(500).json({ message: 'Error fetching feature flags' });
  }
}

async function getAuditLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const filter = req.query.category ? { category: req.query.category } : {};
    const logs = await db.listAuditLogPage({ limit, offset, filter });
    res.json(logs);
  } catch (error) {
    logger.error('[AdminController] getAuditLogs', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
}

module.exports = {
  getDashboardStats,
  getUserDetail,
  updateUserRole,
  adjustCredits,
  getRevenue,
  getSubscriptions,
  cancelSubscription,
  getProviders,
  getModels,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSystemHealth,
  getAuditLogs,
  getFeatureFlags,
  getLockedUsers,
  unlockUser,
};
