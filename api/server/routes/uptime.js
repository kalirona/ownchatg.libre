const express = require('express');
const ctrl = require('~/server/controllers/UptimeController');

const router = express.Router();

router.get('/', ctrl.getStatusPage);
router.get('/json', ctrl.getJsonStatus);

module.exports = router;
