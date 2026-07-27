const { logger } = require('@librechat/data-schemas');
const orgService = require('~/server/services/OrganizationService');

async function createOrg(req, res) {
  try {
    const { name, description, planTier } = req.body;
    if (!name) return res.status(400).json({ message: 'Organization name is required' });
    const org = await orgService.createOrganization(req.user.id, { name, description, planTier });
    res.status(201).json({ organization: org });
  } catch (error) {
    logger.error('[OrganizationController] createOrg', error);
    res.status(500).json({ message: 'Error creating organization' });
  }
}

async function listOrgs(req, res) {
  try {
    const organizations = await orgService.getUserOrganizations(req.user.id);
    res.json({ organizations });
  } catch (error) {
    logger.error('[OrganizationController] listOrgs', error);
    res.status(500).json({ message: 'Error listing organizations' });
  }
}

async function getOrg(req, res) {
  try {
    const org = await orgService.getOrganization(req.params.id, req.user.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json({ organization: org });
  } catch (error) {
    logger.error('[OrganizationController] getOrg', error);
    res.status(500).json({ message: 'Error fetching organization' });
  }
}

async function updateOrg(req, res) {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.user.id, req.body);
    res.json({ organization: org });
  } catch (error) {
    logger.error('[OrganizationController] updateOrg', error);
    res.status(500).json({ message: error.message || 'Error updating organization' });
  }
}

async function deleteOrg(req, res) {
  try {
    await orgService.deleteOrganization(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] deleteOrg', error);
    res.status(500).json({ message: error.message || 'Error deleting organization' });
  }
}

async function listMembers(req, res) {
  try {
    const members = await orgService.listMembers(req.params.id, req.user.id);
    res.json({ members });
  } catch (error) {
    logger.error('[OrganizationController] listMembers', error);
    res.status(500).json({ message: error.message || 'Error listing members' });
  }
}

async function updateMemberRole(req, res) {
  try {
    const { userId, role } = req.body;
    await orgService.updateMemberRole(req.params.id, req.user.id, userId, role);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] updateMemberRole', error);
    res.status(500).json({ message: error.message || 'Error updating member role' });
  }
}

async function removeMember(req, res) {
  try {
    await orgService.removeMember(req.params.id, req.user.id, req.params.userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] removeMember', error);
    res.status(500).json({ message: error.message || 'Error removing member' });
  }
}

async function createInvite(req, res) {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const invite = await orgService.createInvite(req.params.id, req.user.id, email, role);
    res.status(201).json({ invite });
  } catch (error) {
    logger.error('[OrganizationController] createInvite', error);
    res.status(500).json({ message: error.message || 'Error creating invite' });
  }
}

async function acceptInvite(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    const invite = await orgService.acceptInvite(token, req.user.id);
    res.json({ invite });
  } catch (error) {
    logger.error('[OrganizationController] acceptInvite', error);
    res.status(400).json({ message: error.message || 'Error accepting invite' });
  }
}

async function listInvites(req, res) {
  try {
    const invites = await orgService.listInvites(req.params.id, req.user.id);
    res.json({ invites });
  } catch (error) {
    logger.error('[OrganizationController] listInvites', error);
    res.status(500).json({ message: error.message || 'Error listing invites' });
  }
}

async function revokeInvite(req, res) {
  try {
    await orgService.revokeInvite(req.params.id, req.user.id, req.params.inviteId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] revokeInvite', error);
    res.status(500).json({ message: error.message || 'Error revoking invite' });
  }
}

async function getTeams(req, res) {
  try {
    const teams = await orgService.getTeams(req.params.id, req.user.id);
    res.json({ teams });
  } catch (error) {
    logger.error('[OrganizationController] getTeams', error);
    res.status(500).json({ message: error.message || 'Error listing teams' });
  }
}

async function createTeam(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required' });
    const team = await orgService.createTeam(req.params.id, req.user.id, { name, description });
    res.status(201).json({ team });
  } catch (error) {
    logger.error('[OrganizationController] createTeam', error);
    res.status(500).json({ message: error.message || 'Error creating team' });
  }
}

async function updateTeam(req, res) {
  try {
    const team = await orgService.updateTeam(req.params.id, req.params.teamId, req.user.id, req.body);
    res.json({ team });
  } catch (error) {
    logger.error('[OrganizationController] updateTeam', error);
    res.status(500).json({ message: error.message || 'Error updating team' });
  }
}

async function deleteTeam(req, res) {
  try {
    await orgService.deleteTeam(req.params.id, req.params.teamId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] deleteTeam', error);
    res.status(500).json({ message: error.message || 'Error deleting team' });
  }
}

async function getTeamMembers(req, res) {
  try {
    const members = await orgService.getTeamMembers(req.params.teamId, req.user.id);
    res.json({ members });
  } catch (error) {
    logger.error('[OrganizationController] getTeamMembers', error);
    res.status(500).json({ message: error.message || 'Error listing team members' });
  }
}

async function addTeamMember(req, res) {
  try {
    const { userId, role } = req.body;
    await orgService.addTeamMember(req.params.id, req.params.teamId, req.user.id, userId, role);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] addTeamMember', error);
    res.status(500).json({ message: error.message || 'Error adding team member' });
  }
}

async function removeTeamMember(req, res) {
  try {
    await orgService.removeTeamMember(req.params.id, req.params.teamId, req.user.id, req.params.targetUserId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[OrganizationController] removeTeamMember', error);
    res.status(500).json({ message: error.message || 'Error removing team member' });
  }
}

module.exports = {
  createOrg, listOrgs, getOrg, updateOrg, deleteOrg,
  listMembers, updateMemberRole, removeMember,
  createInvite, acceptInvite, listInvites, revokeInvite,
  getTeams, createTeam, updateTeam, deleteTeam,
  getTeamMembers, addTeamMember, removeTeamMember,
};
