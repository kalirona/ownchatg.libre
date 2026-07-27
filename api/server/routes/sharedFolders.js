const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/SharedFolderController');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/org/:id/folders', ctrl.listFolders);
router.post('/org/:id/folders', ctrl.createFolder);
router.put('/org/:id/folders/:folderId', ctrl.updateFolder);
router.delete('/org/:id/folders/:folderId', ctrl.deleteFolder);

module.exports = router;
