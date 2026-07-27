const { logger } = require('@librechat/data-schemas');
const folderService = require('~/server/services/SharedFolderService');

async function listFolders(req, res) {
  try {
    const folders = await folderService.getFolders(req.params.id, req.user.id, req.query.teamId || null);
    res.json({ folders });
  } catch (error) {
    logger.error('[SharedFolderController] listFolders', error);
    res.status(error.message === 'Not authorized' ? 403 : 500).json({ message: error.message });
  }
}

async function createFolder(req, res) {
  try {
    const folder = await folderService.createFolder(req.params.id, req.user.id, {
      name: req.body.name,
      teamId: req.body.teamId,
      parentId: req.body.parentId,
    });
    res.status(201).json({ folder });
  } catch (error) {
    logger.error('[SharedFolderController] createFolder', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function updateFolder(req, res) {
  try {
    const folder = await folderService.updateFolder(req.params.folderId, req.params.id, req.user.id, req.body);
    res.json({ folder });
  } catch (error) {
    logger.error('[SharedFolderController] updateFolder', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function deleteFolder(req, res) {
  try {
    await folderService.deleteFolder(req.params.folderId, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SharedFolderController] deleteFolder', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = { listFolders, createFolder, updateFolder, deleteFolder };
