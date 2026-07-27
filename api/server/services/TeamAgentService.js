const TeamAgent = require('~/server/models/TeamAgent');
const { logger } = require('@librechat/data-schemas');
const permService = require('~/server/services/OrgPermissionService');

async function getTeamAgents(orgId, userId, teamId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'view_org_content');
    const filter = teamId ? { team: teamId } : { organization: orgId, team: null };
    return await TeamAgent.find(filter)
      .populate('agent', 'name description model provider')
      .populate('sharedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
  } catch (err) {
    logger.error('[TeamAgentService] getTeamAgents', err);
    throw err;
  }
}

async function shareAgent(orgId, userId, agentId, teamId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'create_shared_content');
    const existing = await TeamAgent.findOne({ organization: orgId, agent: agentId }).lean();
    if (existing) throw new Error('Agent already shared to this org');
    const ta = await TeamAgent.create({
      agent: agentId,
      organization: orgId,
      team: teamId || null,
      sharedBy: userId,
      scope: teamId ? 'team' : 'org',
    });
    return ta;
  } catch (err) {
    logger.error('[TeamAgentService] shareAgent', err);
    throw err;
  }
}

async function unshareAgent(orgId, userId, agentId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'manage_teams');
    await TeamAgent.findOneAndDelete({ organization: orgId, agent: agentId });
  } catch (err) {
    logger.error('[TeamAgentService] unshareAgent', err);
    throw err;
  }
}

module.exports = { getTeamAgents, shareAgent, unshareAgent };
