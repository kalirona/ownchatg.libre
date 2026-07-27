const express = require('express');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const { createMulterInstance } = require('~/server/routes/files/multer');
const controller = require('~/server/controllers/KnowledgeController');

const initialize = async () => {
  const router = express.Router();
  router.use(requireJwtAuth);
  router.use(configMiddleware);

  const upload = await createMulterInstance();

  router.get('/documents', controller.listDocuments);
  router.post('/upload', upload.single('file'), controller.uploadDocument);
  router.delete('/documents/:id', controller.deleteDocument);

  router.get('/collections', controller.getCollections);
  router.post('/collections', controller.createCollection);
  router.put('/collections/:id', controller.updateCollection);
  router.delete('/collections/:id', controller.deleteCollection);
  router.post('/collections/:id/files', controller.addFileToCollection);
  router.delete('/collections/:id/files/:fileId', controller.removeFileFromCollection);

  router.post('/search', controller.search);
  router.post('/chat', controller.chat);

  return router;
};

module.exports = { initialize };
