const express = require('express');
const ctrl = require('~/server/controllers/BetterStackController');

const router = express.Router();

router.post('/log-drain', express.json({ limit: '1mb' }), ctrl.logDrain);

module.exports = router;
