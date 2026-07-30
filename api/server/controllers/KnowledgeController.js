const { logger } = require('@librechat/data-schemas');
const KnowledgeCollection = require('~/server/models/KnowledgeCollection');
const KnowledgeService = require('~/server/services/Knowledge/KnowledgeService');
const KnowledgeAdminSettings = require('~/server/models/KnowledgeAdminSettings');
const ImportJob = require('~/server/models/ImportJob');
const KnowledgeQueueService = require('~/server/services/Queue/KnowledgeQueueService');
const SSEService = require('~/server/services/SSEService');
const db = require('~/models');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const fileRecord = await KnowledgeService.uploadDocument(req, req.file);
    res.json({ file: fileRecord });
  } catch (error) {
    logger.error('[Knowledge] uploadDocument error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
}

async function listDocuments(req, res) {
  try {
    const { embedded, search, collectionId } = req.query;
    const filter = { user: req.user.id };
    if (embedded === 'true') {
      filter.embedded = true;
    } else if (embedded === 'false') {
      filter.embedded = false;
    }
    if (search) {
      filter.filename = { $regex: search, $options: 'i' };
    }
    let files = await db.getFiles(filter, { createdAt: -1 });

    if (collectionId) {
      const col = await KnowledgeCollection.findById(collectionId).lean();
      if (col) {
        const colFileIds = new Set((col.fileIds || []).map((f) => f.toString()));
        files = files.filter((f) => colFileIds.has(f._id.toString()));
      }
    }

    const enriched = files.map((f) => ({
      ...f,
      embeddingStatus: f.embedded ? 'ready' : (f.embeddingStatus || 'pending'),
    }));
    res.json({ files: enriched || [], total: (enriched || []).length });
  } catch (error) {
    logger.error('[Knowledge] listDocuments error:', error);
    res.status(500).json({ error: error.message || 'Failed to list documents' });
  }
}

async function getDocumentDetail(req, res) {
  try {
    const file = await db.getFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const detail = {
      ...file,
      questionsAsked: file.questionsAsked || 0,
      referencedCount: file.referencedCount || 0,
      embeddingProvider: file.embeddingProvider || null,
      chunkSize: file.chunkSize || null,
      chunkOverlap: file.chunkOverlap || null,
      ocrUsed: file.ocrUsed || false,
    };
    res.json({ document: detail });
  } catch (error) {
    logger.error('[Knowledge] getDocumentDetail error:', error);
    res.status(500).json({ error: error.message || 'Failed to get document detail' });
  }
}

async function renameDocument(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const file = await db.updateFile(req.params.id, { filename: name.trim() });
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ document: file });
  } catch (error) {
    logger.error('[Knowledge] renameDocument error:', error);
    res.status(500).json({ error: error.message || 'Failed to rename document' });
  }
}

async function reindexDocument(req, res) {
  try {
    const file = await db.getFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const updated = await KnowledgeService.reindexDocument(req, file);
    res.json({ document: updated });
  } catch (error) {
    logger.error('[Knowledge] reindexDocument error:', error);
    res.status(500).json({ error: error.message || 'Failed to reindex document' });
  }
}

async function moveDocument(req, res) {
  try {
    const { collectionId } = req.body;
    const file = await db.getFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    await KnowledgeCollection.updateMany(
      { user: req.user.id },
      { $pull: { fileIds: file._id } },
    );
    if (collectionId) {
      const col = await KnowledgeCollection.findOneAndUpdate(
        { _id: collectionId, user: req.user.id },
        { $addToSet: { fileIds: file._id } },
        { new: true },
      );
      if (!col) {
        return res.status(404).json({ error: 'Collection not found' });
      }
    }
    res.json({ document: file });
  } catch (error) {
    logger.error('[Knowledge] moveDocument error:', error);
    res.status(500).json({ error: error.message || 'Failed to move document' });
  }
}

async function deleteDocument(req, res) {
  try {
    const file = await db.deleteFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    await KnowledgeCollection.updateMany(
      { user: req.user.id },
      { $pull: { fileIds: file._id } },
    );
    res.json({ message: 'Document deleted' });
  } catch (error) {
    logger.error('[Knowledge] deleteDocument error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
}

async function getCollections(req, res) {
  try {
    const collections = await KnowledgeCollection.find({ user: req.user.id })
      .populate('fileIds', 'file_id filename type bytes embedded pages chunks embeddingModel createdAt')
      .sort({ name: 1 });

    const enriched = collections.map((col) => {
      const docs = col.fileIds || [];
      return {
        ...col.toObject(),
        documentCount: docs.length,
        totalBytes: docs.reduce((sum, d) => sum + (d.bytes || 0), 0),
        embeddedCount: docs.filter((d) => d.embedded).length,
        chunkCount: docs.reduce((sum, d) => sum + (d.chunks || 0), 0),
      };
    });

    res.json({ collections: enriched });
  } catch (error) {
    logger.error('[Knowledge] getCollections error:', error);
    res.status(500).json({ error: error.message || 'Failed to get collections' });
  }
}

async function getCollectionAnalytics(req, res) {
  try {
    const col = await KnowledgeCollection.findOne({ _id: req.params.id, user: req.user.id })
      .populate('fileIds', 'bytes embedded chunks');
    if (!col) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    const docs = col.fileIds || [];
    const documentCount = docs.length;
    const totalBytes = docs.reduce((sum, d) => sum + (d.bytes || 0), 0);
    const chunkCount = docs.reduce((sum, d) => sum + (d.chunks || 0), 0);
    const embeddedCount = docs.filter((d) => d.embedded).length;
    const embeddedPct = documentCount > 0 ? Math.round((embeddedCount / documentCount) * 100) : 0;

    res.json({
      analytics: {
        documentCount,
        totalBytes,
        chunkCount,
        embeddedPct,
        aiChats: col.aiChats || 0,
        questionsAsked: col.questionsAsked || 0,
      },
    });
  } catch (error) {
    logger.error('[Knowledge] getCollectionAnalytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get collection analytics' });
  }
}

async function createCollection(req, res) {
  try {
    const { name, description, parentId, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    const collection = await KnowledgeCollection.create({
      user: req.user.id,
      name: name.trim(),
      description: description || '',
      parentId: parentId || null,
      icon: icon || 'folder',
      tenantId: req.user.tenantId,
    });
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] createCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to create collection' });
  }
}

async function updateCollection(req, res) {
  try {
    const { name, description, parentId, icon } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (parentId !== undefined) updates.parentId = parentId || null;
    if (icon !== undefined) updates.icon = icon;
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] updateCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to update collection' });
  }
}

async function deleteCollection(req, res) {
  try {
    const collection = await KnowledgeCollection.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    await KnowledgeCollection.updateMany(
      { user: req.user.id, parentId: collection._id },
      { $set: { parentId: null } },
    );
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    logger.error('[Knowledge] deleteCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete collection' });
  }
}

async function addFileToCollection(req, res) {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $addToSet: { fileIds: fileId } },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] addFileToCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to add file' });
  }
}

async function removeFileFromCollection(req, res) {
  try {
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $pull: { fileIds: req.params.fileId } },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] removeFileFromCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove file' });
  }
}

async function search(req, res) {
  try {
    const { fileIds, query, k } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }
    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one fileId is required' });
    }
    const results = await KnowledgeService.searchDocuments({ fileIds, query, k, req });
    res.json({ results });
  } catch (error) {
    logger.error('[Knowledge] search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
}

async function chat(req, res) {
  try {
    const { message, fileIds, action } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one fileId is required' });
    }
    const result = await KnowledgeService.chatWithDocuments({ message, fileIds, action, req });
    if (result.collectionId) {
      await KnowledgeCollection.findByIdAndUpdate(result.collectionId, {
        $inc: { aiChats: 1, questionsAsked: 1 },
        $set: { lastActivityAt: new Date() },
      });
    }
    res.json(result);
  } catch (error) {
    logger.error('[Knowledge] chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
}

async function quickAction(req, res) {
  try {
    const { fileIds, action } = req.body;
    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one fileId is required' });
    }
    if (!action) {
      return res.status(400).json({ error: 'Action type is required' });
    }
    const result = await KnowledgeService.runQuickAction({ fileIds, action, req });
    res.json(result);
  } catch (error) {
    logger.error('[Knowledge] quickAction error:', error);
    res.status(500).json({ error: error.message || 'Quick action failed' });
  }
}

async function getAdminSettings(req, res) {
  try {
    let settings = await KnowledgeAdminSettings.findOne().lean();
    if (!settings) {
      settings = await KnowledgeAdminSettings.create({});
    }
    res.json({ settings });
  } catch (error) {
    logger.error('[Knowledge] getAdminSettings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get settings' });
  }
}

async function updateAdminSettings(req, res) {
  try {
    const settings = await KnowledgeAdminSettings.findOneAndUpdate(
      {},
      { $set: req.body },
      { upsert: true, new: true },
    );
    res.json({ settings });
  } catch (error) {
    logger.error('[Knowledge] updateAdminSettings error:', error);
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
}

async function uploadDocumentAsync(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!KnowledgeQueueService.isAvailable) {
      return res.status(503).json({ error: 'Background processing is not available (Redis required)' });
    }

    const job = await ImportJob.create({
      user: req.user.id,
      tenantId: req.user.tenantId,
      sourceType: 'file_upload',
      filePath: req.file.path,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      collection: req.body.collectionId || null,
      status: 'queued',
      progress: { pct: 0, currentStep: 'queued', message: 'Queued for processing' },
      queueTimestamps: { queuedAt: new Date() },
      steps: [{ name: 'queued', status: 'completed', startedAt: new Date(), finishedAt: new Date(), duration: 0 }],
      logs: [{ level: 'info', message: 'File upload queued for processing', timestamp: new Date() }],
    });

    await KnowledgeQueueService.enqueueImport({
      jobId: job._id.toString(),
      sourceType: 'file_upload',
      filePath: req.file.path,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      userId: req.user.id,
      collectionId: req.body.collectionId || null,
    });

    logger.info(`[Knowledge] Async upload queued: job=${job._id}, file=${req.file.originalname}`);
    res.json({ job: await ImportJob.findById(job._id).lean() });
  } catch (error) {
    logger.error('[Knowledge] uploadDocumentAsync error:', error);
    res.status(500).json({ error: error.message || 'Async upload failed' });
  }
}

async function listImportJobs(req, res) {
  try {
    const { status, sourceType, collectionId, limit, offset } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (sourceType) filter.sourceType = sourceType;
    if (collectionId) filter.collection = collectionId;

    const total = await ImportJob.countDocuments(filter);
    const jobs = await ImportJob.find(filter)
      .sort({ 'queueTimestamps.queuedAt': -1 })
      .skip(parseInt(offset) || 0)
      .limit(Math.min(parseInt(limit) || 50, 200))
      .lean();

    res.json({ jobs, total });
  } catch (error) {
    logger.error('[Knowledge] listImportJobs error:', error);
    res.status(500).json({ error: error.message || 'Failed to list import jobs' });
  }
}

async function getImportJob(req, res) {
  try {
    const job = await ImportJob.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    res.json({ job });
  } catch (error) {
    logger.error('[Knowledge] getImportJob error:', error);
    res.status(500).json({ error: error.message || 'Failed to get import job' });
  }
}

async function cancelImportJob(req, res) {
  try {
    const job = await ImportJob.findOne({ _id: req.params.id, user: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    if (!['queued', 'processing', 'retrying'].includes(job.status)) {
      return res.status(400).json({ error: `Job cannot be cancelled in status: ${job.status}` });
    }
    job.status = 'cancelled';
    job.progress.message = 'Cancelled by user';
    job.progress.finishedAt = new Date();
    job.queueTimestamps.cancelledAt = new Date();
    job.logs.push({ level: 'info', message: 'Job cancelled by user', timestamp: new Date() });
    await job.save();

    try {
      await KnowledgeQueueService.cancelJob(KnowledgeQueueService.QUEUE_NAMES.IMPORTS, job._id.toString());
    } catch (e) {
      logger.warn('[Knowledge] BullMQ cancel failed:', e.message);
    }

    res.json({ job: job.toObject() });
  } catch (error) {
    logger.error('[Knowledge] cancelImportJob error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel job' });
  }
}

async function retryImportJob(req, res) {
  try {
    const job = await ImportJob.findOne({ _id: req.params.id, user: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    if (job.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed jobs can be retried' });
    }
    job.status = 'queued';
    job.retries = 0;
    job.error = null;
    job.progress = { pct: 0, currentStep: 'queued', message: 'Retrying...' };
    job.queueTimestamps.queuedAt = new Date();
    job.logs.push({ level: 'info', message: 'Job retry requested', timestamp: new Date() });
    await job.save();

    await KnowledgeQueueService.enqueueImport({
      jobId: job._id.toString(),
      sourceType: job.sourceType,
      filePath: job.filePath,
      originalFilename: job.originalFilename,
      mimeType: job.mimeType,
      fileSize: job.fileSize,
      userId: req.user.id,
      collectionId: job.collection?.toString(),
    });

    res.json({ job: job.toObject() });
  } catch (error) {
    logger.error('[Knowledge] retryImportJob error:', error);
    res.status(500).json({ error: error.message || 'Failed to retry job' });
  }
}

async function subscribeJobSSE(req, res) {
  try {
    const job = await ImportJob.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    SSEService.subscribeToJob(req.params.id, res);
  } catch (error) {
    logger.error('[Knowledge] subscribeJobSSE error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'SSE subscription failed' });
    }
  }
}

async function reindexCollectionAsync(req, res) {
  try {
    const collection = await KnowledgeCollection.findOne({ _id: req.params.id, user: req.user.id });
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!KnowledgeQueueService.isAvailable) {
      return res.status(503).json({ error: 'Background processing is not available (Redis required)' });
    }

    const fileIds = (collection.fileIds || []).map((f) => f._id?.toString() || f.toString());
    if (fileIds.length === 0) {
      return res.status(400).json({ error: 'Collection has no documents to reindex' });
    }

    const job = await ImportJob.create({
      user: req.user.id,
      tenantId: req.user.tenantId,
      sourceType: 'reindex',
      collection: collection._id,
      status: 'queued',
      progress: { pct: 0, currentStep: 'queued', message: 'Queued for reindex' },
      queueTimestamps: { queuedAt: new Date() },
      metadata: { reindexFileIds: fileIds, collectionName: collection.name },
      steps: [{ name: 'queued', status: 'completed', startedAt: new Date(), finishedAt: new Date(), duration: 0 }],
      logs: [{ level: 'info', message: `Reindex queued for collection "${collection.name}"`, timestamp: new Date() }],
    });

    await KnowledgeQueueService.enqueueReindex({
      jobId: job._id.toString(),
      collectionId: collection._id.toString(),
      fileIds,
      userId: req.user.id,
    });

    res.json({ job: await ImportJob.findById(job._id).lean() });
  } catch (error) {
    logger.error('[Knowledge] reindexCollectionAsync error:', error);
    res.status(500).json({ error: error.message || 'Reindex failed' });
  }
}

async function getQueueStatus(req, res) {
  try {
    const status = await KnowledgeQueueService.getQueueStatus();
    res.json(status);
  } catch (error) {
    logger.error('[Knowledge] getQueueStatus error:', error);
    res.status(500).json({ error: error.message || 'Failed to get queue status' });
  }
}

async function getFailedJobs(req, res) {
  try {
    const { queueName, start, end } = req.query;
    const jobs = await KnowledgeQueueService.getFailedJobs(
      queueName || KnowledgeQueueService.QUEUE_NAMES.IMPORTS,
      parseInt(start) || 0,
      parseInt(end) || 50,
    );
    const mapped = await Promise.all(jobs.map(async (j) => ({
      id: j.id,
      name: j.name,
      data: j.data,
      attemptsMade: j.attemptsMade,
      failedReason: j.failedReason,
      timestamp: j.timestamp,
      processedOn: j.processedOn,
      finishedOn: j.finishedOn,
      stacktrace: j.stacktrace,
    })));
    res.json({ jobs: mapped });
  } catch (error) {
    logger.error('[Knowledge] getFailedJobs error:', error);
    res.status(500).json({ error: error.message || 'Failed to get failed jobs' });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentDetail,
  renameDocument,
  reindexDocument,
  moveDocument,
  deleteDocument,
  getCollections,
  getCollectionAnalytics,
  createCollection,
  updateCollection,
  deleteCollection,
  addFileToCollection,
  removeFileFromCollection,
  search,
  chat,
  quickAction,
  getAdminSettings,
  updateAdminSettings,
  uploadDocumentAsync,
  listImportJobs,
  getImportJob,
  cancelImportJob,
  retryImportJob,
  subscribeJobSSE,
  reindexCollectionAsync,
  getQueueStatus,
};
