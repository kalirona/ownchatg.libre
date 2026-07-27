const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const inviteService = require('~/server/services/InviteService');
const orgService = require('~/server/services/OrganizationService');

async function getInviteInfo(req, res) {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });
    res.json({
      invite: {
        _id: invite._id,
        organization: invite.organization,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    logger.error('[InviteController] getInviteInfo', error);
    res.status(500).json({ message: 'Error fetching invite' });
  }
}

async function acceptInviteByToken(req, res) {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const user = await mongoose.model('User').findById(req.user.id).select('email').lean();
    if (user.email !== invite.email) return res.status(403).json({ message: 'Email mismatch' });
    const result = await orgService.acceptInvite(req.params.token, req.user.id);
    res.json({ success: true, organization: result.organization });
  } catch (error) {
    logger.error('[InviteController] acceptInviteByToken', error);
    res.status(400).json({ message: error.message || 'Error accepting invite' });
  }
}

module.exports = { getInviteInfo, acceptInviteByToken };
