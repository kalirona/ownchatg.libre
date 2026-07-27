const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/TeamAgentController');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/org/:id/agents', ctrl.listTeamAgents);
router.post('/org/:id/agents', ctrl.shareAgent);
router.delete('/org/:id/agents/:agentId', ctrl.unshareAgent);

module.exports = router;
