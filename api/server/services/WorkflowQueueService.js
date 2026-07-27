const { Queue, Worker } = require('bullmq');
const { logger } = require('@librechat/data-schemas');

const WORKFLOW_QUEUE_NAME = 'workflow-execution';
const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 200,
  removeOnFail: 100,
};

let queue = null;
let worker = null;

function getRedisConnection() {
  let ioredisClient;
  try {
    ioredisClient = require('@librechat/api').ioredisClient;
  } catch (e) {
    logger.warn('[WorkflowQueue] @librechat/api not available');
    return null;
  }
  if (!ioredisClient) {
    logger.warn('[WorkflowQueue] Redis not configured, workflow queue disabled');
    return null;
  }
  return ioredisClient;
}

const connection = getRedisConnection();
const isAvailable = !!connection;

function getQueue() {
  if (!isAvailable) {
    return null;
  }
  if (!queue) {
    queue = new Queue(WORKFLOW_QUEUE_NAME, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    logger.info('[WorkflowQueue] Queue initialized');
  }
  return queue;
}

const stepProcessors = {};

function registerProcessor(stepType, handlerFn) {
  stepProcessors[stepType] = handlerFn;
}

function startWorker(processFn) {
  if (!isAvailable || worker) {
    return;
  }
  worker = new Worker(
    WORKFLOW_QUEUE_NAME,
    async (job) => {
      const { step, executionId, workflowId, context } = job.data;
      const processor = stepProcessors[step.type];
      if (!processor) {
        throw new Error(`No processor registered for step type: ${step.type}`);
      }
      const result = await processor(step, context, executionId, workflowId, (progress) => {
        job.updateProgress(progress);
      });
      return result;
    },
    {
      connection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[WorkflowQueue] Job ${job.id} completed for workflow step`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[WorkflowQueue] Job ${job.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('[WorkflowQueue] Worker error:', err);
  });

  logger.info('[WorkflowQueue] Worker started');
}

async function enqueueStep(step, executionId, workflowId, context, opts = {}) {
  const q = getQueue();
  if (!q) {
    throw new Error('Workflow queue is not available (Redis required)');
  }
  const { delay, retries } = opts;
  const job = await q.add(
    `step-${executionId}-${step.order}`,
    { step, executionId, workflowId, context },
    {
      delay: delay ? delay * 1000 : 0,
      attempts: (retries ?? 3) + 1,
      backoff: { type: 'exponential', delay: 2000 },
    },
  );
  return job;
}

async function cancelStepJob(jobId) {
  const q = getQueue();
  if (!q) { return; }
  const job = await q.getJob(jobId);
  if (job) {
    await job.remove();
  }
}

async function getQueueStatus() {
  const q = getQueue();
  if (!q) {
    return { available: false, message: 'Redis not configured' };
  }
  const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  return { available: true, ...counts };
}

async function shutdown() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}

module.exports = {
  getQueue,
  registerProcessor,
  startWorker,
  enqueueStep,
  cancelStepJob,
  getQueueStatus,
  shutdown,
  isAvailable,
};
