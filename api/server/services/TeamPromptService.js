const TeamPrompt = require('~/server/models/TeamPrompt');
const { logger } = require('@librechat/data-schemas');
const permService = require('~/server/services/OrgPermissionService');

async function getTeamPrompts(orgId, userId, teamId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'view_org_content');
    const filter = teamId ? { team: teamId } : { organization: orgId, team: null };
    return await TeamPrompt.find(filter)
      .populate('promptGroup', 'name oneliner category command')
      .populate('sharedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
  } catch (err) {
    logger.error('[TeamPromptService] getTeamPrompts', err);
    throw err;
  }
}

async function sharePrompt(orgId, userId, promptGroupId, teamId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'create_shared_content');
    const existing = await TeamPrompt.findOne({ organization: orgId, promptGroup: promptGroupId }).lean();
    if (existing) throw new Error('Prompt already shared to this org');
    const tp = await TeamPrompt.create({
      promptGroup: promptGroupId,
      organization: orgId,
      team: teamId || null,
      sharedBy: userId,
      scope: teamId ? 'team' : 'org',
    });
    return tp;
  } catch (err) {
    logger.error('[TeamPromptService] sharePrompt', err);
    throw err;
  }
}

async function unsharePrompt(orgId, userId, promptGroupId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'manage_teams');
    await TeamPrompt.findOneAndDelete({ organization: orgId, promptGroup: promptGroupId });
  } catch (err) {
    logger.error('[TeamPromptService] unsharePrompt', err);
    throw err;
  }
}

module.exports = { getTeamPrompts, sharePrompt, unsharePrompt };
