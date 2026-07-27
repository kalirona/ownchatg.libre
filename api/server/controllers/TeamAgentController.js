const { logger } = require('@librechat/data-schemas');
const taService = require('~/server/services/TeamAgentService');

async function listTeamAgents(req, res) {
  try {
    const agents = await taService.getTeamAgents(req.params.id, req.user.id, req.query.teamId || null);
    res.json({ agents });
  } catch (error) {
    logger.error('[TeamAgentController] listTeamAgents', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function shareAgent(req, res) {
  try {
    const ta = await taService.shareAgent(req.params.id, req.user.id, req.body.agentId, req.body.teamId);
    res.status(201).json({ teamAgent: ta });
  } catch (error) {
    logger.error('[TeamAgentController] shareAgent', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function unshareAgent(req, res) {
  try {
    await taService.unshareAgent(req.params.id, req.user.id, req.params.agentId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[TeamAgentController] unshareAgent', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = { listTeamAgents, shareAgent, unshareAgent };
