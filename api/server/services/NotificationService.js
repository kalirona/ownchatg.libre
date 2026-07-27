const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const Notification = require('~/server/models/Notification');
const emailService = require('./EmailNotificationService');
const prefService = require('./NotificationPreferenceService');
const pushService = require('./PushNotificationService');
const integrationService = require('./IntegrationService');

const LOW_CREDIT_THRESHOLD = 100;

async function createNotification({ userId, type, title, body, data, sendEmail = false }) {
  try {
    const prefs = await prefService.getPreferences(userId);

    const inApp = prefService.isChannelEnabled(prefs, type, 'inApp');
    const shouldSendEmail = sendEmail && prefService.isChannelEnabled(prefs, type, 'email');
    const sendSlack = prefService.isChannelEnabled(prefs, type, 'slack');
    const sendDiscord = prefService.isChannelEnabled(prefs, type, 'discord');

    let notification = null;
    if (inApp) {
      notification = await Notification.create({ user: userId, type, title, body, data });
    }

    if (shouldSendEmail) {
      await emailService.sendNotificationEmail(userId, type, title, body, data);
      if (notification) {
        notification.emailSent = true;
        await notification.save();
      }
    }

    await pushService.sendPush(userId, title, body, { ...data, type });

    if (sendSlack || sendDiscord) {
      const provider = sendSlack ? 'slack' : 'discord';
      await integrationService.sendNotificationToIntegrations(userId, title, body, type, provider);
    }

    return notification;
  } catch (err) {
    logger.error('[NotificationService] createNotification', err);
    return null;
  }
}

async function getUserNotifications(userId, query = {}) {
  try {
    const { page = 1, limit = 50, unreadOnly = false, type } = query;
    const filter = { user: new mongoose.Types.ObjectId(userId) };
    if (unreadOnly) { filter.read = false; }
    if (type) { filter.type = type; }
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(userId), read: false });
    return { notifications, unreadCount, total, page, limit, pages: Math.ceil(total / limit) };
  } catch (err) {
    logger.error('[NotificationService] getUserNotifications', err);
    return { notifications: [], unreadCount: 0, total: 0, page: 1, limit, pages: 0 };
  }
}

async function markAsRead(userId, notificationId) {
  try { await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true, readAt: new Date() }); } catch (err) { logger.error('[NotificationService] markAsRead', err); }
}

async function markAllAsRead(userId) {
  try { await Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() }); } catch (err) { logger.error('[NotificationService] markAllAsRead', err); }
}

async function deleteNotification(userId, notificationId) {
  try { await Notification.findOneAndDelete({ _id: notificationId, user: userId }); } catch (err) { logger.error('[NotificationService] deleteNotification', err); }
}

async function getUnreadCount(userId) {
  try { return await Notification.countDocuments({ user: userId, read: false }); } catch (err) { logger.error('[NotificationService] getUnreadCount', err); return 0; }
}

async function sendBillingAlert(userId, transaction) {
  const title = transaction.status === 'completed' ? 'Payment Successful' : 'Payment Failed';
  const body = transaction.status === 'completed' ? `$${transaction.amount} payment received${transaction.creditsAwarded ? ` — ${transaction.creditsAwarded} credits added` : ''}.` : `Payment of $${transaction.amount} failed. Please check your billing details.`;
  return createNotification({ userId, type: 'billing_alert', title, body, data: { transactionId: String(transaction._id), status: transaction.status, amount: transaction.amount, creditsAwarded: transaction.creditsAwarded, date: new Date().toLocaleDateString() }, sendEmail: true });
}

async function sendLowCreditAlert(userId, balance) {
  if (balance.tokenCredits > LOW_CREDIT_THRESHOLD) { return null; }
  return createNotification({ userId, type: 'low_credit', title: 'Low Credit Balance', body: `Your credit balance is ${balance.tokenCredits} credits. Consider recharging to avoid service interruption.`, data: { tokenCredits: balance.tokenCredits }, sendEmail: true });
}

async function sendSubscriptionExpiringAlert(userId, subscription) {
  const daysLeft = subscription.currentPeriodEnd ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / 86400000) : 0;
  const title = 'Subscription Expiring';
  const body = daysLeft <= 0 ? 'Your subscription has expired. Renew now to continue using premium features.' : `Your ${subscription.planName} subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
  return createNotification({ userId, type: 'subscription_expiring', title, body, data: { subscriptionId: String(subscription._id), planName: subscription.planName, daysLeft }, sendEmail: true });
}

async function sendWelcomeNotification(userId) {
  return createNotification({ userId, type: 'welcome', title: 'Welcome to LibreChat!', body: 'Start a conversation, explore the marketplace, or customize your profile to get the most out of the platform.', data: {}, sendEmail: true });
}

async function sendTeamInviteNotification(userId, orgName, inviterName, inviteLink) {
  return createNotification({ userId, type: 'team_invite', title: `Invitation to ${orgName}`, body: `${inviterName} has invited you to join ${orgName}.`, data: { orgName, inviterName, inviteLink }, sendEmail: true });
}

async function createSystemNotification(title, body, data = {}) {
  try {
    const User = mongoose.models.User;
    const users = await User.find({}).select('_id').lean();
    const notifications = users.map((u) => ({ user: u._id, type: 'system_announcement', title, body, data }));
    const result = await Notification.insertMany(notifications);
    logger.info(`[NotificationService] Created ${result.length} system notifications`);
    return { count: result.length };
  } catch (err) {
    logger.error('[NotificationService] createSystemNotification', err);
    return { count: 0 };
  }
}

async function sendWorkflowFinishedNotification(userId, workflowName, executionId, failed, error, completedSteps, totalSteps) {
  return createNotification({
    userId, type: 'workflow_finished',
    title: failed ? `Workflow failed: ${workflowName}` : `Workflow completed: ${workflowName}`,
    body: failed ? `Workflow "${workflowName}" failed.${error ? ` Error: ${error}` : ''}` : `Workflow "${workflowName}" completed successfully (${completedSteps}/${totalSteps} steps).`,
    data: { workflowName, executionId, failed, error, completedSteps, totalSteps, actionUrl: `${process.env.BASE_URL || 'http://localhost:3080'}/workflows/${executionId}/runs` },
    sendEmail: true,
  });
}

async function sendImageFinishedNotification(userId, prompt) {
  return createNotification({
    userId, type: 'image_finished',
    title: 'Image Generation Complete',
    body: `Your image has been generated.${prompt ? ` Prompt: ${prompt}` : ''}`,
    data: { prompt, actionUrl: `${process.env.BASE_URL || 'http://localhost:3080'}/images` },
    sendEmail: true,
  });
}

async function sendVideoFinishedNotification(userId, prompt) {
  return createNotification({
    userId, type: 'video_finished',
    title: 'Video Generation Complete',
    body: `Your video has been generated.${prompt ? ` Prompt: ${prompt}` : ''}`,
    data: { prompt, actionUrl: `${process.env.BASE_URL || 'http://localhost:3080'}/video` },
    sendEmail: true,
  });
}

async function sendDigest(userId) {
  try {
    const since = new Date(Date.now() - 86400000);
    const notifications = await Notification.find({ user: userId, createdAt: { $gte: since }, read: false }).sort({ createdAt: -1 }).limit(20).lean();
    if (notifications.length === 0) { return { sent: false, reason: 'no_unread' }; }

    const User = mongoose.models.User;
    const user = await User.findById(userId).select('email name').lean();
    if (!user?.email) { return { sent: false, reason: 'no_email' }; }

    const digestItems = notifications.map((n) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><p style="margin:0 0 4px;font-weight:600;font-size:14px;color:#111827;">${n.title}</p><p style="margin:0;font-size:13px;color:#6b7280;">${n.body}</p></td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;padding:40px 16px;"><table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:500px;margin:0 auto;"><tr><td style="text-align:center;padding:0 0 20px;"><h1 style="color:#16a34a;font-size:28px;font-weight:700;margin:0;">${process.env.APP_TITLE || 'LibreChat'}</h1></td></tr><tr><td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><h2 style="color:#111827;font-size:20px;font-weight:600;margin:0 0 8px;">Your Daily Digest</h2><p style="color:#6b7280;font-size:14px;margin:0 0 20px;">You have ${notifications.length} unread notification${notifications.length === 1 ? '' : 's'}.</p><table width="100%" cellspacing="0" cellpadding="0" border="0">${digestItems}</table><a href="${process.env.BASE_URL || 'http://localhost:3080'}/notifications" style="display:block;text-align:center;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;margin-top:20px;">View All Notifications</a></td></tr><tr><td style="padding:24px 0;text-align:center;"><p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${process.env.APP_TITLE || 'LibreChat'}. All rights reserved.</p></td></tr></table></body></html>`;

    const { sendEmail: sendEmailFn } = require('~/server/utils');
    await sendEmailFn({ email: user.email, subject: `Your Daily Digest — ${notifications.length} unread`, template: null, payload: null, throwError: false, html });
    await prefService.updateDigestSent(userId);
    logger.info(`[NotificationService] Sent digest to ${user.email} (${notifications.length} items)`);
    return { sent: true, count: notifications.length };
  } catch (err) {
    logger.error('[NotificationService] sendDigest', err);
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  createNotification, getUserNotifications, markAsRead, markAllAsRead,
  deleteNotification, getUnreadCount, sendBillingAlert, sendLowCreditAlert,
  sendSubscriptionExpiringAlert, sendWelcomeNotification, sendTeamInviteNotification,
  createSystemNotification, sendWorkflowFinishedNotification, sendImageFinishedNotification,
  sendVideoFinishedNotification, sendDigest,
};
