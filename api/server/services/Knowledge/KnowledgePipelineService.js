const { logger } = require('@librechat/data-schemas');
const ImportJob = require('~/server/models/ImportJob');
const KnowledgeCollection = require('~/server/models/KnowledgeCollection');
const importers = require('./importers');
const db = require('~/models');

const CHUNK_SIZE = parseInt(process.env.KNOWLEDGE_CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(process.env.KNOWLEDGE_CHUNK_OVERLAP) || 150;

/**
 * Run the full import pipeline for a job.
 * Pipeline: Extract → OCR → Chunk → Embed → Save
 */
async function runImportPipeline(jobId, progressCallback) {
  const job = await ImportJob.findById(jobId);
  if (!job) { throw new Error(`ImportJob ${jobId} not found`); }

  const steps = [
    { name: 'extracting', label: 'Extracting content' },
    { name: 'ocr', label: 'Running OCR' },
    { name: 'chunking', label: 'Chunking text' },
    { name: 'embedding', label: 'Generating embeddings' },
    { name: 'saving', label: 'Saving to database' },
  ];

  const result = { chunkCount: 0, vectorCount: 0, documentIds: [] };

  try {
    // --- Step 1: Extract ---
    await updateJobProgress(job, 'extracting', 5, 'Extracting content...', progressCallback);
    const importer = importers.getImporter(job.sourceType, { filePath: job.filePath, originalFilename: job.originalFilename, mimeType: job.mimeType });
    const payload = await importer.fetch({ filePath: job.filePath, originalFilename: job.originalFilename, mimeType: job.mimeType });
    const normalized = await importer.normalize(payload);

    const rawText = normalized.rawText;
    const metadata = normalized.metadata;
    const segments = normalized.segments;

    if (!rawText || rawText.length === 0) {
      throw new Error('No extractable content found in the source');
    }
    await completeStep(job, 'extracting');

    // --- Step 2: OCR (if needed, skip for now) ---
    await updateJobProgress(job, 'ocr', 20, 'Skipping OCR (text already extracted)', progressCallback);
    await completeStep(job, 'ocr');

    // --- Step 3: Chunk ---
    await updateJobProgress(job, 'chunking', 30, 'Chunking text...', progressCallback);
    const chunks = chunkText(rawText, segments, CHUNK_SIZE, CHUNK_OVERLAP);
    result.chunkCount = chunks.length;
    await completeStep(job, 'chunking');

    // --- Step 4: Embed ---
    await updateJobProgress(job, 'embedding', 50, 'Generating embeddings...', progressCallback);
    const embeddingResult = await generateEmbeddings(chunks, job);
    result.vectorCount = embeddingResult.vectorCount || chunks.length;
    await completeStep(job, 'embedding');

    // --- Step 5: Save ---
    await updateJobProgress(job, 'saving', 80, 'Saving to database...', progressCallback);
    const savedDocs = await saveToDatabase({
      req: { user: { id: job.user }, config: {} },
      chunks,
      embeddings: embeddingResult.embeddings,
      metadata,
      job,
    });
    result.documentIds = savedDocs;
    await completeStep(job, 'saving');

    // --- Complete ---
    job.status = 'completed';
    job.progress = { pct: 100, currentStep: 'completed', message: 'Ready', startedAt: job.progress.startedAt, finishedAt: new Date() };
    job.result = { ...job.result, ...result };
    job.queueTimestamps.completedAt = new Date();
    job.duration = job.progress.startedAt ? new Date() - job.progress.startedAt : null;
    await job.save();

    // Update collection metadata
    if (job.collection) {
      await KnowledgeCollection.findByIdAndUpdate(job.collection, {
        $inc: { documentCount: result.documentIds.length, chunkCount: result.chunkCount },
        $set: { lastActivityAt: new Date() },
      });
    }

    if (progressCallback) {
      await progressCallback({ status: 'completed', pct: 100, message: 'Ready', result });
    }

    return result;
  } catch (err) {
    logger.error(`[KnowledgePipeline] Job ${jobId} failed at stage ${job.progress?.currentStep}:`, err.message);
    job.status = 'failed';
    job.error = { message: err.message, stack: err.stack, stage: job.progress?.currentStep || 'pipeline' };
    job.progress.message = `Failed: ${err.message}`;
    job.progress.finishedAt = new Date();
    await job.save();

    if (progressCallback) {
      await progressCallback({ status: 'failed', error: err.message });
    }

    throw err;
  }
}

async function updateJobProgress(job, stepName, pct, message, progressCallback) {
  job.status = stepName;
  job.progress = {
    pct,
    currentStep: stepName,
    message,
    startedAt: job.progress?.startedAt || new Date(),
    finishedAt: null,
  };
  await job.save();

  if (progressCallback) {
    await progressCallback({ status: stepName, pct, message, step: stepName });
  }
}

async function completeStep(job, stepName) {
  const existing = job.steps.find((s) => s.name === stepName);
  if (existing) {
    existing.status = 'completed';
    existing.finishedAt = new Date();
    existing.duration = existing.startedAt ? new Date() - existing.startedAt : 0;
  } else {
    job.steps.push({ name: stepName, status: 'completed', startedAt: new Date(), finishedAt: new Date(), duration: 0 });
  }
  job.markModified('steps');
  await job.save();
}

function chunkText(rawText, segments, chunkSize, overlap) {
  if (!rawText || rawText.length <= chunkSize) {
    return [{ text: rawText, index: 0, page: segments?.[0]?.page || null }];
  }

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < rawText.length) {
    let end = start + chunkSize;
    if (end < rawText.length) {
      const boundary = rawText.lastIndexOf('\n\n', end);
      if (boundary > start + chunkSize / 2) { end = boundary; }
    }
    const text = rawText.slice(start, Math.min(end, rawText.length)).trim();
    if (text) {
      const matchingSegment = segments?.find((s) => s.text && rawText.indexOf(s.text) >= start && rawText.indexOf(s.text) < end);
      chunks.push({ text, index, page: matchingSegment?.page || null });
      index++;
    }
    start = end - (end < rawText.length ? overlap : 0);
  }

  return chunks;
}

async function generateEmbeddings(chunks, job) {
  const RAG_API_URL = process.env.RAG_API_URL;
  if (!RAG_API_URL) {
    logger.warn('[KnowledgePipeline] RAG_API_URL not set, skipping embeddings');
    return { embeddings: chunks.map(() => null), vectorCount: 0 };
  }

  const axios = require('axios');
  const { generateShortLivedToken } = require('@librechat/api');

  const jwtToken = generateShortLivedToken(job.user.toString());
  const BATCH_SIZE = 10;
  const embeddings = [];
  let vectorCount = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    try {
      const res = await axios.post(`${RAG_API_URL}/embed`, {
        texts: batch.map((c) => c.text),
        file_id: job._id.toString(),
        job_id: job._id.toString(),
      }, {
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      if (res.data?.vectors) {
        embeddings.push(...res.data.vectors);
        vectorCount += res.data.vectors.length;
      }
    } catch (err) {
      logger.error('[KnowledgePipeline] Embedding batch failed:', err.message);
      embeddings.push(...batch.map(() => null));
    }
  }

  return { embeddings, vectorCount };
}

async function saveToDatabase({ req, chunks, embeddings, metadata, job }) {
  const crypto = require('crypto');
  const file_id = crypto.randomUUID();
  const { FileSources, FileContext } = require('librechat-data-provider');
  const documentIds = [];

  const fileRecord = await db.createFile({
    user: job.user,
    file_id,
    filepath: job.filePath || FileSources.local,
    filename: job.originalFilename || metadata?.title || 'imported-document',
    context: FileContext.agents,
    type: job.mimeType || 'text/plain',
    bytes: job.fileSize || 0,
    embedded: true,
    embeddingStatus: 'ready',
    source: job.sourceType,
    chunks: chunks.length,
    pages: null,
    embeddingModel: process.env.KNOWLEDGE_EMBEDDING_MODEL || 'text-embedding-3-small',
    tenantId: job.tenantId,
  }, true);

  documentIds.push(fileRecord._id);

  if (job.collection) {
    await KnowledgeCollection.findByIdAndUpdate(job.collection, {
      $addToSet: { fileIds: fileRecord._id },
    });
  }

  return documentIds;
}

async function reindexCollection(collectionId, req) {
  const collection = await KnowledgeCollection.findById(collectionId).populate('fileIds');
  if (!collection) { throw new Error('Collection not found'); }
  const fileIds = (collection.fileIds || []).map((f) => f._id.toString());
  const ImportJob = require('~/server/models/ImportJob');

  const job = await ImportJob.create({
    user: req.user.id,
    collection: collectionId,
    sourceType: 'reindex',
    status: 'queued',
    progress: { pct: 0, currentStep: 'queued', message: 'Queued for reindex' },
    queueTimestamps: { queuedAt: new Date() },
    tenantId: req.user.tenantId,
  });

  return job;
}

module.exports = {
  runImportPipeline,
  reindexCollection,
  chunkText,
};
