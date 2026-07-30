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
  router.get('/documents/:id/detail', controller.getDocumentDetail);
  router.put('/documents/:id/rename', controller.renameDocument);
  router.post('/documents/:id/reindex', controller.reindexDocument);
  router.post('/documents/:id/move', controller.moveDocument);
  router.post('/upload', upload.single('file'), controller.uploadDocument);
  router.delete('/documents/:id', controller.deleteDocument);

  router.get('/collections', controller.getCollections);
  router.get('/collections/:id/analytics', controller.getCollectionAnalytics);
  router.post('/collections', controller.createCollection);
  router.put('/collections/:id', controller.updateCollection);
  router.delete('/collections/:id', controller.deleteCollection);
  router.post('/collections/:id/files', controller.addFileToCollection);
  router.delete('/collections/:id/files/:fileId', controller.removeFileFromCollection);

  router.post('/search', controller.search);
  router.post('/chat', controller.chat);
  router.post('/quick-action', controller.quickAction);

  router.post('/upload/async', upload.single('file'), controller.uploadDocumentAsync);

  router.get('/jobs', controller.listImportJobs);
  router.get('/jobs/:id', controller.getImportJob);
  router.post('/jobs/:id/cancel', controller.cancelImportJob);
  router.post('/jobs/:id/retry', controller.retryImportJob);
  router.get('/jobs/:id/sse', controller.subscribeJobSSE);

  router.post('/collections/:id/reindex', controller.reindexCollectionAsync);

  router.get('/admin/settings', controller.getAdminSettings);
  router.put('/admin/settings', controller.updateAdminSettings);
  router.get('/admin/queue/status', controller.getQueueStatus);

  return router;
};

module.exports = { initialize };
