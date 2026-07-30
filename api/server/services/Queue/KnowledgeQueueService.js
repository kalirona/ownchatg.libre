const { Queue, Worker, QueueScheduler } = require('bullmq');
const { logger } = require('@librechat/data-schemas');

const QUEUE_NAMES = {
  IMPORTS: 'knowledge-imports',
  EMBEDDINGS: 'knowledge-embeddings',
  REINDEX: 'knowledge-reindex',
  WEBSITE_CRAWLER: 'knowledge-website-crawler',
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 200,
  removeOnFail: 100,
};

let connection = null;
let queues = {};
let workers = {};
let isAvailable = false;

function getRedisConnection() {
  if (connection) { return connection; }
  try {
    const api = require('@librechat/api');
    if (api.ioredisClient) {
      connection = api.ioredisClient;
      isAvailable = true;
      logger.info('[KnowledgeQueue] Redis connection acquired');
      return connection;
    }
  } catch (e) {
    logger.warn('[KnowledgeQueue] @librechat/api not available, queues disabled');
  }
  isAvailable = false;
  return null;
}

function getQueue(name) {
  if (!isAvailable) { return null; }
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 3,
      },
    });
    logger.info(`[KnowledgeQueue] Queue "${name}" initialized`);
  }
  return queues[name];
}

function getImportQueue() { return getQueue(QUEUE_NAMES.IMPORTS); }
function getEmbeddingQueue() { return getQueue(QUEUE_NAMES.EMBEDDINGS); }
function getReindexQueue() { return getQueue(QUEUE_NAMES.REINDEX); }
function getCrawlerQueue() { return getQueue(QUEUE_NAMES.WEBSITE_CRAWLER); }

async function enqueueImport(jobData, opts = {}) {
  const q = getImportQueue();
  if (!q) { throw new Error('Import queue not available (Redis required)'); }
  const job = await q.add(
    `import-${jobData.sourceType}-${Date.now()}`,
    jobData,
    {
      jobId: jobData.jobId,
      delay: opts.delay || 0,
      attempts: opts.attempts || 3,
      backoff: { type: 'exponential', delay: opts.backoffDelay || 5000 },
      priority: opts.priority || 0,
    },
  );
  logger.info(`[KnowledgeQueue] Import job ${job.id} queued (${jobData.sourceType})`);
  return job;
}

async function enqueueReindex(jobData, opts = {}) {
  const q = getReindexQueue();
  if (!q) { throw new Error('Reindex queue not available (Redis required)'); }
  const job = await q.add(
    `reindex-${jobData.collectionId || jobData.documentId}-${Date.now()}`,
    jobData,
    { jobId: jobData.jobId, attempts: opts.attempts || 3, backoff: { type: 'exponential', delay: 5000 } },
  );
  return job;
}

async function enqueueEmbedding(jobData) {
  const q = getEmbeddingQueue();
  if (!q) { throw new Error('Embedding queue not available (Redis required)'); }
  return q.add(`embed-${Date.now()}`, jobData, { attempts: 3, backoff: { type: 'exponential', delay: 3000 } });
}

async function cancelJob(queueName, jobId) {
  const q = getQueue(queueName);
  if (!q) { return; }
  const job = await q.getJob(jobId);
  if (job) {
    await job.remove();
    logger.info(`[KnowledgeQueue] Job ${jobId} cancelled from ${queueName}`);
  }
}

async function getQueueStatus() {
  if (!isAvailable) {
    return { available: false, message: 'Redis not configured' };
  }
  const statuses = {};
  for (const [key, name] of Object.entries(QUEUE_NAMES)) {
    const q = getQueue(name);
    if (q) {
      const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
      statuses[key] = { name, ...counts };
    }
  }
  return { available: true, queues: statuses };
}

async function pauseQueue(name) {
  const q = getQueue(name);
  if (q) { await q.pause(); }
}

async function resumeQueue(name) {
  const q = getQueue(name);
  if (q) { await q.resume(); }
}

async function getFailedJobs(name, start = 0, end = 50) {
  const q = getQueue(name);
  if (!q) { return []; }
  return q.getJobs(['failed'], start, end);
}

async function retryJob(queueName, jobId) {
  const q = getQueue(queueName);
  if (!q) { throw new Error('Queue not available'); }
  const job = await q.getJob(jobId);
  if (!job) { throw new Error('Job not found'); }
  await job.retry();
  return job;
}

function registerWorker(queueName, processor, opts = {}) {
  if (!isAvailable || workers[queueName]) { return; }
  workers[queueName] = new Worker(
    queueName,
    processor,
    {
      connection,
      concurrency: opts.concurrency || 3,
      maxStalledCount: opts.maxStalledCount || 3,
      stalledInterval: opts.stalledInterval || 30000,
      lockDuration: opts.lockDuration || 60000,
      limiter: opts.limiter || { max: opts.maxPerSecond || 10, duration: 1000 },
    },
  );

  workers[queueName].on('completed', (job) => {
    logger.info(`[KnowledgeQueue] ${queueName} job ${job.id} completed`);
  });
  workers[queueName].on('failed', (job, err) => {
    logger.error(`[KnowledgeQueue] ${queueName} job ${job.id} failed: ${err.message}`);
  });
  workers[queueName].on('error', (err) => {
    logger.error(`[KnowledgeQueue] ${queueName} worker error:`, err);
  });

  logger.info(`[KnowledgeQueue] Worker registered for ${queueName} (concurrency: ${opts.concurrency || 3})`);
  return workers[queueName];
}

async function shutdown() {
  for (const [name, worker] of Object.entries(workers)) {
    await worker.close();
    logger.info(`[KnowledgeQueue] Worker ${name} closed`);
  }
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    logger.info(`[KnowledgeQueue] Queue ${name} closed`);
  }
  workers = {};
  queues = {};
}

getRedisConnection();

module.exports = {
  QUEUE_NAMES,
  getImportQueue,
  getEmbeddingQueue,
  getReindexQueue,
  getCrawlerQueue,
  enqueueImport,
  enqueueReindex,
  enqueueEmbedding,
  cancelJob,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  getFailedJobs,
  retryJob,
  registerWorker,
  shutdown,
  isAvailable,
};
