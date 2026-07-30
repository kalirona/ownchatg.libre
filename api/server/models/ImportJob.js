const mongoose = require('mongoose');

const importJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  collection: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeCollection', default: null, index: true },
  workspace: { type: String, default: null },
  sourceType: {
    type: String,
    enum: ['file_upload', 'website', 'youtube', 'googledrive', 'notion', 'dropbox', 'onedrive', 'github', 'sitemap', 'rss', 'confluence', 'sharepoint', 'zip', 'api', 'reindex'],
    required: true,
  },
  sourceUri: { type: String, default: null },
  originalFilename: { type: String, default: null },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: null },
  filePath: { type: String, default: null },
  storageKey: { type: String, default: null },

  status: {
    type: String,
    enum: ['queued', 'waiting', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'completed', 'failed', 'cancelled', 'retrying'],
    default: 'queued',
    index: true,
  },

  progress: {
    pct: { type: Number, default: 0 },
    currentStep: { type: String, default: '' },
    message: { type: String, default: '' },
    eta: { type: Number, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },

  steps: [{
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    duration: { type: Number },
    error: { type: String },
  }],

  logs: [{
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
  }],

  result: {
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeCollection' },
    chunkCount: { type: Number, default: 0 },
    vectorCount: { type: Number, default: 0 },
  },

  error: {
    message: { type: String },
    stack: { type: String },
    stage: { type: String },
  },

  retries: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  workerId: { type: String, default: null },
  duration: { type: Number, default: null },

  queueTimestamps: {
    queuedAt: { type: Date, default: Date.now },
    processingStartedAt: { type: Date },
    completedAt: { type: Date },
  },

  metadata: { type: mongoose.Schema.Types.Mixed },
  tenantId: { type: String, index: true },
}, { timestamps: true });

importJobSchema.index({ user: 1, status: 1, createdAt: -1 });
importJobSchema.index({ user: 1, sourceType: 1, createdAt: -1 });
importJobSchema.index({ status: 1, queueTimestamps: 1 });

const ImportJob = mongoose.model('ImportJob', importJobSchema);

module.exports = ImportJob;
