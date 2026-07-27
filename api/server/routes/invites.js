const express = require('express');
const optionalJwtAuth = require('~/server/middleware/optionalJwtAuth');
const ctrl = require('~/server/controllers/InviteController');

const router = express.Router();

router.get('/:token', ctrl.getInviteInfo);
router.post('/:token/accept', optionalJwtAuth, ctrl.acceptInviteByToken);

module.exports = router;
