const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/TeamPromptController');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/org/:id/prompts', ctrl.listTeamPrompts);
router.post('/org/:id/prompts', ctrl.sharePrompt);
router.delete('/org/:id/prompts/:promptGroupId', ctrl.unsharePrompt);

module.exports = router;
