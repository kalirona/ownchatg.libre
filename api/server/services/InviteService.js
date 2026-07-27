const mongoose = require('mongoose');
const Organization = require('~/server/models/Organization');
const OrganizationInvite = require('~/server/models/OrganizationInvite');
const OrganizationMember = require('~/server/models/OrganizationMember');
const { sendEmail } = require('~/server/utils/sendEmail');
const { logger } = require('@librechat/data-schemas');

async function getInviteByToken(token) {
  try {
    const invite = await OrganizationInvite.findOne({ token, status: 'pending' })
      .populate('organization', 'name slug')
      .populate('invitedBy', 'name')
      .lean();
    if (!invite) return null;
    if (new Date() > invite.expiresAt) {
      await OrganizationInvite.findByIdAndUpdate(invite._id, { status: 'expired' });
      return null;
    }
    return invite;
  } catch (err) {
    logger.error('[InviteService] getInviteByToken', err);
    return null;
  }
}

async function sendOrgInviteEmail(invite) {
  try {
    const org = await Organization.findById(invite.organization).lean();
    const inviter = await mongoose.model('User').findById(invite.invitedBy).select('name').lean();
    const appName = process.env.APP_TITLE || 'LibreChat';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3080';
    const inviteLink = `${baseUrl}/invite/${invite.token}`;
    await sendEmail({
      email: invite.email,
      subject: `You've been invited to join ${org.name}`,
      template: 'orgInvite',
      payload: {
        appName,
        orgName: org.name,
        invitedByName: inviter?.name || 'A team member',
        role: invite.role,
        inviteLink,
        year: new Date().getFullYear(),
      },
      throwError: false,
    });
  } catch (err) {
    logger.error('[InviteService] sendOrgInviteEmail', err);
  }
}

module.exports = { getInviteByToken, sendOrgInviteEmail };
