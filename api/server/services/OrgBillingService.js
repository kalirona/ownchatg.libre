const mongoose = require('mongoose');
const OrgSubscription = require('~/server/models/OrgSubscription');
const OrgBalance = require('~/server/models/OrgBalance');
const OrgTransaction = require('~/server/models/OrgTransaction');
const Organization = require('~/server/models/Organization');
const { logger } = require('@librechat/data-schemas');
const permService = require('~/server/services/OrgPermissionService');

async function getOrgSubscription(orgId, userId) {
  await permService.requireOrgPermission(orgId, userId, 'view_org_content');
  const sub = await OrgSubscription.findOne({ organization: orgId }).lean();
  return sub;
}

async function getOrgBalance(orgId, userId) {
  await permService.requireOrgPermission(orgId, userId, 'manage_billing');
  let balance = await OrgBalance.findOne({ organization: orgId }).lean();
  if (!balance) {
    balance = await OrgBalance.create({ organization: orgId, tokenCredits: 0, bonusCredits: 0 });
  }
  return balance;
}

async function getOrgTransactions(orgId, userId, limit = 50) {
  await permService.requireOrgPermission(orgId, userId, 'manage_billing');
  return await OrgTransaction.find({ organization: orgId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function initializeOrgBilling(orgId) {
  const existingBalance = await OrgBalance.findOne({ organization: orgId }).lean();
  if (!existingBalance) {
    await OrgBalance.create({ organization: orgId, tokenCredits: 0, bonusCredits: 0 });
  }
  const existingSub = await OrgSubscription.findOne({ organization: orgId }).lean();
  if (!existingSub) {
    const org = await Organization.findById(orgId).lean();
    await OrgSubscription.create({
      organization: orgId,
      planName: 'Free',
      planTier: org?.planTier || 'free',
      provider: 'none',
      status: 'trial',
      seats: 5,
      maxSeats: 10,
    });
  }
}

async function allocateCredits(orgId, userId, credits, description) {
  await permService.requireOrgPermission(orgId, userId, 'manage_billing');
  const balance = await OrgBalance.findOne({ organization: orgId });
  if (!balance) throw new Error('Org balance not found');
  balance.tokenCredits += credits;
  await balance.save();
  await OrgTransaction.create({
    organization: orgId,
    user: userId,
    type: 'allocation',
    amount: 0,
    credits,
    description: description || 'Credit allocation',
  });
  return balance;
}

async function deductCredits(orgId, userId, credits, description) {
  const balance = await OrgBalance.findOne({ organization: orgId });
  if (!balance) throw new Error('Org balance not found');
  const available = balance.tokenCredits + balance.bonusCredits;
  if (available < credits) throw new Error('Insufficient org credits');
  const fromBonus = Math.min(balance.bonusCredits, credits);
  balance.bonusCredits -= fromBonus;
  balance.tokenCredits -= (credits - fromBonus);
  await balance.save();
  await OrgTransaction.create({
    organization: orgId,
    user: userId,
    type: 'usage',
    amount: 0,
    credits: -credits,
    description: description || 'Credit usage',
  });
  return balance;
}

async function getOrgCreditSummary(orgId, userId) {
  await permService.requireOrgPermission(orgId, userId, 'view_org_content');
  const balance = await OrgBalance.findOne({ organization: orgId }).lean();
  const sub = await OrgSubscription.findOne({ organization: orgId }).lean();
  const recentUsage = await OrgTransaction.find({ organization: orgId, type: 'usage' })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return {
    balance: balance || { tokenCredits: 0, bonusCredits: 0 },
    subscription: sub || null,
    recentUsage,
  };
}

module.exports = {
  getOrgSubscription,
  getOrgBalance,
  getOrgTransactions,
  initializeOrgBilling,
  allocateCredits,
  deductCredits,
  getOrgCreditSummary,
};
