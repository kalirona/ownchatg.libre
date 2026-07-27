const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { sendEmail } = require('~/server/utils');

const TEMPLATE_MAP = {
  welcome: 'welcome',
  billing_alert: 'paymentSuccess',
  low_credit: 'lowCredits',
  subscription_expiring: 'subscriptionExpiring',
  team_invite: 'inviteUser',
  workflow_finished: 'workflowFinished',
  image_finished: 'imageFinished',
  video_finished: 'videoFinished',
};

async function sendNotificationEmail(userId, type, title, body, data) {
  try {
    const User = mongoose.models.User;
    const user = await User.findById(userId).select('email name').lean();
    if (!user || !user.email) {
      logger.warn(`[EmailNotificationService] No email for user ${userId}`);
      return;
    }

    const template = TEMPLATE_MAP[type] || 'notificationGeneric';
    const payload = { title, body, userName: user.name || 'User', name: user.name || 'User', appName: process.env.APP_TITLE || 'LibreChat', year: new Date().getFullYear(), actionUrl: process.env.BASE_URL || 'http://localhost:3080', ...(data || {}) };

    if (type === 'low_credit') {
      payload.balance = data?.tokenCredits ?? 'N/A';
    }
    if (type === 'billing_alert') {
      payload.amount = data?.amount ?? 'N/A';
      payload.credits = data?.creditsAwarded;
      payload.date = data?.date || new Date().toLocaleDateString();
    }
    if (type === 'subscription_expiring') {
      payload.planName = data?.planName || 'Premium';
      payload.daysLeft = data?.daysLeft;
      payload.expired = !data?.daysLeft || data.daysLeft <= 0;
      payload.pluralDays = data?.daysLeft > 1;
    }
    if (type === 'workflow_finished') {
      payload.workflowName = data?.workflowName || 'Workflow';
      payload.failed = data?.failed;
      payload.error = data?.error;
      payload.completedSteps = data?.completedSteps;
      payload.totalSteps = data?.totalSteps;
      payload.steps = data?.totalSteps > 0;
    }
    if (type === 'image_finished' || type === 'video_finished') {
      payload.prompt = data?.prompt || '';
    }

    await sendEmail({
      email: user.email,
      subject: title,
      template,
      payload,
      throwError: false,
    });
    logger.info(`[EmailNotificationService] Sent ${type} email to ${user.email}`);
  } catch (err) {
    logger.error('[EmailNotificationService] sendNotificationEmail', err);
  }
}

module.exports = { sendNotificationEmail };
