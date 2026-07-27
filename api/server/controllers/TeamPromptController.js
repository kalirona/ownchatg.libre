const { logger } = require('@librechat/data-schemas');
const tpService = require('~/server/services/TeamPromptService');

async function listTeamPrompts(req, res) {
  try {
    const prompts = await tpService.getTeamPrompts(req.params.id, req.user.id, req.query.teamId || null);
    res.json({ prompts });
  } catch (error) {
    logger.error('[TeamPromptController] listTeamPrompts', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function sharePrompt(req, res) {
  try {
    const tp = await tpService.sharePrompt(req.params.id, req.user.id, req.body.promptGroupId, req.body.teamId);
    res.status(201).json({ teamPrompt: tp });
  } catch (error) {
    logger.error('[TeamPromptController] sharePrompt', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function unsharePrompt(req, res) {
  try {
    await tpService.unsharePrompt(req.params.id, req.user.id, req.params.promptGroupId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[TeamPromptController] unsharePrompt', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = { listTeamPrompts, sharePrompt, unsharePrompt };
