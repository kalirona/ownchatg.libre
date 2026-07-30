/**
 * Knowledge Worker - Separate process that runs independently of Express.
 * Consumes BullMQ queues and processes import jobs asynchronously.
 *
 * Usage:
 *   node api/server/workers/knowledgeWorker.js
 *   # or
 *   WORKER_CONCURRENCY=5 node api/server/workers/knowledgeWorker.js
 */

const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });
const { logger } = require('@librechat/data-schemas');
const mongoose = require('mongoose');
const KnowledgeQueueService = require('~/server/services/Queue/KnowledgeQueueService');
const ImportJob = require('~/server/models/ImportJob');
const KnowledgePipelineService = require('~/server/services/Knowledge/KnowledgePipelineService');
const SSE = require('~/server/services/SSEService');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 3;
const MAX_RETRIES = parseInt(process.env.KNOWLEDGE_MAX_RETRIES) || 3;
const GRACEFUL_TIMEOUT = parseInt(process.env.WORKER_GRACEFUL_TIMEOUT_MS) || 15000;

let shuttingDown = false;

async function connectMongo() {
  if (!MONGO_URI) {
    logger.error('[KnowledgeWorker] MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  logger.info('[KnowledgeWorker] MongoDB connected');
}

async function sendSSEUpdate(jobId, data) {
  try {
    await SSE.sendToJob(jobId, data);
  } catch (e) {
    logger.warn(`[KnowledgeWorker] SSE send failed for job ${jobId}: ${e.message}`);
  }
}

async function processImportJob(job) {
  const data = job.data;
  const jobId = data.jobId;

  logger.info(`[KnowledgeWorker] Processing import job ${jobId} (${data.sourceType})`);

  // Mark job as processing
  await ImportJob.findByIdAndUpdate(jobId, {
    status: 'processing',
    workerId: `${require('os').hostname()}-${process.pid}`,
    'progress.startedAt': new Date(),
    'progress.currentStep': 'processing',
    'progress.message': 'Starting...',
    'queueTimestamps.processingStartedAt': new Date(),
    $push: {
      steps: { name: 'processing', status: 'running', startedAt: new Date() },
      logs: { level: 'info', message: `Worker started processing ${data.sourceType}`, timestamp: new Date() },
    },
  });

  await sendSSEUpdate(jobId, { status: 'processing', pct: 0, message: 'Starting...' });

  try {
    const progressFn = async (update) => {
      await sendSSEUpdate(jobId, { ...update, jobId });
    };

    const result = await KnowledgePipelineService.runImportPipeline(jobId, progressFn);

    logger.info(`[KnowledgeWorker] Job ${jobId} completed. ${result.chunkCount} chunks, ${result.vectorCount} vectors`);

    await ImportJob.findByIdAndUpdate(jobId, {
      $push: { logs: { level: 'info', message: `Completed: ${result.chunkCount} chunks, ${result.vectorCount} vectors`, timestamp: new Date() } },
    });

    await sendSSEUpdate(jobId, {
      status: 'completed',
      pct: 100,
      message: 'Ready',
      result: { documentIds: result.documentIds, chunkCount: result.chunkCount },
    });

    return result;
  } catch (err) {
    logger.error(`[KnowledgeWorker] Job ${jobId} failed: ${err.message}`);

    const jobDoc = await ImportJob.findById(jobId);
    const retryCount = (jobDoc?.retries || 0) + 1;

    if (retryCount <= MAX_RETRIES) {
      logger.info(`[KnowledgeWorker] Job ${jobId} will retry (${retryCount}/${MAX_RETRIES})`);
      await ImportJob.findByIdAndUpdate(jobId, {
        status: 'retrying',
        retries: retryCount,
        error: { message: err.message, stage: jobDoc?.progress?.currentStep || 'unknown' },
        $push: { logs: { level: 'warn', message: `Retry ${retryCount}/${MAX_RETRIES}: ${err.message}`, timestamp: new Date() } },
      });
      await sendSSEUpdate(jobId, { status: 'retrying', error: err.message, retryCount });

      // Throw so BullMQ handles the retry
      throw err;
    }

    await ImportJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      'progress.finishedAt': new Date(),
      error: { message: err.message, stack: err.stack },
      $push: { logs: { level: 'error', message: `Failed after ${retryCount} retries: ${err.message}`, timestamp: new Date() } },
    });

    await sendSSEUpdate(jobId, { status: 'failed', error: err.message });

    throw err;
  }
}

async function start() {
  logger.info('[KnowledgeWorker] Starting Knowledge Worker...');
  logger.info(`[KnowledgeWorker] Concurrency: ${WORKER_CONCURRENCY}, Max retries: ${MAX_RETRIES}`);

  await connectMongo();

  if (!KnowledgeQueueService.isAvailable) {
    logger.error('[KnowledgeWorker] Redis is not available, worker cannot start');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Register import worker
  KnowledgeQueueService.registerWorker(
    KnowledgeQueueService.QUEUE_NAMES.IMPORTS,
    processImportJob,
    { concurrency: WORKER_CONCURRENCY },
  );

  // Register reindex worker (same pipeline, different queue)
  KnowledgeQueueService.registerWorker(
    KnowledgeQueueService.QUEUE_NAMES.REINDEX,
    async (job) => {
      logger.info(`[KnowledgeWorker] Reindex job ${job.id}`);
      const data = job.data;
      const jobId = data.jobId;
      await ImportJob.findByIdAndUpdate(jobId, { status: 'processing', 'progress.startedAt': new Date() });
      await sendSSEUpdate(jobId, { status: 'processing', pct: 0, message: 'Reindexing...' });
      try {
        const result = await KnowledgePipelineService.runImportPipeline(jobId, (update) => sendSSEUpdate(jobId, update));
        await sendSSEUpdate(jobId, { status: 'completed', pct: 100, message: 'Reindex complete', result });
        return result;
      } catch (err) {
        await sendSSEUpdate(jobId, { status: 'failed', error: err.message });
        throw err;
      }
    },
    { concurrency: Math.max(1, Math.floor(WORKER_CONCURRENCY / 2)) },
  );

  logger.info('[KnowledgeWorker] Workers registered and listening for jobs');
  logger.info('[KnowledgeWorker] Press Ctrl+C to stop');

  // Graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('unhandledRejection', (err) => {
    logger.error('[KnowledgeWorker] Unhandled rejection:', err);
  });
}

async function shutdown() {
  if (shuttingDown) { return; }
  shuttingDown = true;

  logger.info('[KnowledgeWorker] Shutting down gracefully...');
  const timeout = setTimeout(() => {
    logger.error('[KnowledgeWorker] Forced shutdown after timeout');
    process.exit(1);
  }, GRACEFUL_TIMEOUT);

  try {
    await KnowledgeQueueService.shutdown();
    await mongoose.disconnect();
    clearTimeout(timeout);
    logger.info('[KnowledgeWorker] Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('[KnowledgeWorker] Shutdown error:', err);
    process.exit(1);
  }
}

start();
