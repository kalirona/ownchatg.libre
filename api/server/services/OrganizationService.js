const mongoose = require('mongoose');
const crypto = require('crypto');
const { logger } = require('@librechat/data-schemas');
const Organization = require('~/server/models/Organization');
const OrganizationMember = require('~/server/models/OrganizationMember');
const OrganizationInvite = require('~/server/models/OrganizationInvite');
const Team = require('~/server/models/Team');
const TeamMember = require('~/server/models/TeamMember');
const inviteService = require('~/server/services/InviteService');

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'org';
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function createOrganization(userId, { name, description, planTier }) {
  try {
    let slug = generateSlug(name);
    const existing = await Organization.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    const org = await Organization.create({ name, slug, description, owner: userId, planTier });
    await OrganizationMember.create({ organization: org._id, user: userId, role: 'owner' });
    try {
      const orgBilling = require('~/server/services/OrgBillingService');
      await orgBilling.initializeOrgBilling(org._id);
    } catch (_) {}
    return org;
  } catch (err) {
    logger.error('[OrganizationService] createOrganization', err);
    throw err;
  }
}

async function getUserOrganizations(userId) {
  try {
    const memberships = await OrganizationMember.find({ user: userId }).lean();
    const orgIds = memberships.map((m) => m.organization);
    const orgs = await Organization.find({ _id: { $in: orgIds } }).lean();
    const roleMap = {};
    for (const m of memberships) roleMap[m.organization.toString()] = m.role;
    return orgs.map((o) => ({ ...o, role: roleMap[o._id.toString()] || 'member' }));
  } catch (err) {
    logger.error('[OrganizationService] getUserOrganizations', err);
    return [];
  }
}

async function getOrganization(orgId, userId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
    if (!member) return null;
    const org = await Organization.findById(orgId).lean();
    return { ...org, role: member.role };
  } catch (err) {
    logger.error('[OrganizationService] getOrganization', err);
    return null;
  }
}

async function updateOrganization(orgId, userId, updates) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    const allowed = ['name', 'description', 'settings', 'logo'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    if (filtered.name) filtered.slug = generateSlug(filtered.name);
    return await Organization.findByIdAndUpdate(orgId, filtered, { new: true }).lean();
  } catch (err) {
    logger.error('[OrganizationService] updateOrganization', err);
    throw err;
  }
}

async function deleteOrganization(orgId, userId) {
  try {
    const org = await Organization.findById(orgId).lean();
    if (!org || org.owner.toString() !== userId) throw new Error('Not authorized');
    await TeamMember.deleteMany({ team: { $in: (await Team.find({ organization: orgId }).select('_id').lean()).map((t) => t._id) } });
    await Team.deleteMany({ organization: orgId });
    await OrganizationInvite.deleteMany({ organization: orgId });
    await OrganizationMember.deleteMany({ organization: orgId });
    await Organization.findByIdAndDelete(orgId);
  } catch (err) {
    logger.error('[OrganizationService] deleteOrganization', err);
    throw err;
  }
}

async function listMembers(orgId, userId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
    if (!member) throw new Error('Not authorized');
    const members = await OrganizationMember.find({ organization: orgId }).populate('user', 'name email avatar').lean();
    return members.map((m) => ({
      _id: m._id,
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  } catch (err) {
    logger.error('[OrganizationService] listMembers', err);
    throw err;
  }
}

async function updateMemberRole(orgId, userId, targetUserId, role) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    if (role === 'owner') {
      const org = await Organization.findById(orgId);
      org.owner = targetUserId;
      await org.save();
    }
    await OrganizationMember.findOneAndUpdate({ organization: orgId, user: targetUserId }, { role });
  } catch (err) {
    logger.error('[OrganizationService] updateMemberRole', err);
    throw err;
  }
}

async function removeMember(orgId, userId, targetUserId) {
  try {
    const org = await Organization.findById(orgId).lean();
    if (org.owner.toString() === targetUserId) throw new Error('Cannot remove owner');
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    await OrganizationMember.findOneAndDelete({ organization: orgId, user: targetUserId });
  } catch (err) {
    logger.error('[OrganizationService] removeMember', err);
    throw err;
  }
}

async function createInvite(orgId, userId, email, role) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    const existingUser = await mongoose.models.User.findOne({ email });
    const existingMember = existingUser ? await OrganizationMember.findOne({ organization: orgId, user: existingUser._id }).lean() : null;
    if (existingMember) throw new Error('User already a member');
    const invite = await OrganizationInvite.create({
      organization: orgId,
      email,
      role: role || 'member',
      token: generateToken(),
      invitedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
    inviteService.sendOrgInviteEmail(invite);
    return invite;
  } catch (err) {
    logger.error('[OrganizationService] createInvite', err);
    throw err;
  }
}

async function acceptInvite(token, userId) {
  try {
    const invite = await OrganizationInvite.findOne({ token, status: 'pending' }).lean();
    if (!invite) throw new Error('Invalid or expired invite');
    if (new Date() > invite.expiresAt) {
      await OrganizationInvite.findByIdAndUpdate(invite._id, { status: 'expired' });
      throw new Error('Invite expired');
    }
    const user = await mongoose.models.User.findById(userId).select('email').lean();
    if (user.email !== invite.email) throw new Error('Email mismatch');
    await OrganizationMember.create({ organization: invite.organization, user: userId, role: invite.role, invitedBy: invite.invitedBy });
    await OrganizationInvite.findByIdAndUpdate(invite._id, { status: 'accepted' });
    return invite;
  } catch (err) {
    logger.error('[OrganizationService] acceptInvite', err);
    throw err;
  }
}

async function listInvites(orgId, userId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
    if (!member) throw new Error('Not authorized');
    return await OrganizationInvite.find({ organization: orgId }).lean();
  } catch (err) {
    logger.error('[OrganizationService] listInvites', err);
    throw err;
  }
}

async function revokeInvite(orgId, userId, inviteId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    await OrganizationInvite.findByIdAndUpdate(inviteId, { status: 'expired' });
  } catch (err) {
    logger.error('[OrganizationService] revokeInvite', err);
    throw err;
  }
}

async function getTeams(orgId, userId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
    if (!member) throw new Error('Not authorized');
    return await Team.find({ organization: orgId }).lean();
  } catch (err) {
    logger.error('[OrganizationService] getTeams', err);
    throw err;
  }
}

async function createTeam(orgId, userId, { name, description }) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    const team = await Team.create({ name, description, organization: orgId, createdBy: userId });
    await TeamMember.create({ team: team._id, user: userId, role: 'lead' });
    return team;
  } catch (err) {
    logger.error('[OrganizationService] createTeam', err);
    throw err;
  }
}

async function updateTeam(orgId, teamId, userId, updates) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    return await Team.findByIdAndUpdate(teamId, updates, { new: true }).lean();
  } catch (err) {
    logger.error('[OrganizationService] updateTeam', err);
    throw err;
  }
}

async function deleteTeam(orgId, teamId, userId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    await TeamMember.deleteMany({ team: teamId });
    await Team.findByIdAndDelete(teamId);
  } catch (err) {
    logger.error('[OrganizationService] deleteTeam', err);
    throw err;
  }
}

async function getTeamMembers(teamId, userId) {
  try {
    const team = await Team.findById(teamId).lean();
    if (!team) throw new Error('Team not found');
    const member = await OrganizationMember.findOne({ organization: team.organization, user: userId }).lean();
    if (!member) throw new Error('Not authorized');
    const teamMembers = await TeamMember.find({ team: teamId }).populate('user', 'name email avatar').lean();
    return teamMembers;
  } catch (err) {
    logger.error('[OrganizationService] getTeamMembers', err);
    throw err;
  }
}

async function addTeamMember(orgId, teamId, userId, targetUserId, role) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    const orgMember = await OrganizationMember.findOne({ organization: orgId, user: targetUserId }).lean();
    if (!orgMember) throw new Error('User is not an org member');
    await TeamMember.findOneAndUpdate(
      { team: teamId, user: targetUserId },
      { team: teamId, user: targetUserId, role: role || 'member' },
      { upsert: true, new: true },
    );
  } catch (err) {
    logger.error('[OrganizationService] addTeamMember', err);
    throw err;
  }
}

async function removeTeamMember(orgId, teamId, userId, targetUserId) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId, role: { $in: ['owner', 'admin'] } }).lean();
    if (!member) throw new Error('Not authorized');
    await TeamMember.findOneAndDelete({ team: teamId, user: targetUserId });
  } catch (err) {
    logger.error('[OrganizationService] removeTeamMember', err);
    throw err;
  }
}

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  listMembers,
  updateMemberRole,
  removeMember,
  createInvite,
  acceptInvite,
  listInvites,
  revokeInvite,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
};
