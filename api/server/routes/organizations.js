const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/OrganizationController');

const router = express.Router();
router.use(requireJwtAuth);

router.post('/', ctrl.createOrg);
router.get('/', ctrl.listOrgs);
router.get('/:id', ctrl.getOrg);
router.put('/:id', ctrl.updateOrg);
router.delete('/:id', ctrl.deleteOrg);

router.get('/:id/members', ctrl.listMembers);
router.put('/:id/members/role', ctrl.updateMemberRole);
router.delete('/:id/members/:userId', ctrl.removeMember);

router.post('/:id/invites', ctrl.createInvite);
router.get('/:id/invites', ctrl.listInvites);
router.post('/:id/invites/accept', ctrl.acceptInvite);
router.delete('/:id/invites/:inviteId', ctrl.revokeInvite);

router.get('/:id/teams', ctrl.getTeams);
router.post('/:id/teams', ctrl.createTeam);
router.put('/:id/teams/:teamId', ctrl.updateTeam);
router.delete('/:id/teams/:teamId', ctrl.deleteTeam);

router.get('/:id/teams/:teamId/members', ctrl.getTeamMembers);
router.post('/:id/teams/:teamId/members', ctrl.addTeamMember);
router.delete('/:id/teams/:teamId/members/:targetUserId', ctrl.removeTeamMember);

module.exports = router;
