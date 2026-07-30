const mongoose = require('mongoose');

const knowledgeAdminSettingsSchema = new mongoose.Schema({
  embeddingProvider: { type: String, default: 'openai' },
  embeddingModel: { type: String, default: 'text-embedding-3-small' },
  chunkSize: { type: Number, default: 800 },
  chunkOverlap: { type: Number, default: 150 },
  maxFileSize: { type: Number, default: 100 * 1024 * 1024 },
  ocrEnabled: { type: Boolean, default: false },
  supportedTypes: {
    type: [String],
    default: ['pdf', 'docx', 'txt', 'md', 'csv', 'json'],
  },
  vectorDatabase: { type: String, default: 'mongodb' },
  reindexWorkers: { type: Number, default: 3 },
  storageLimits: {
    type: [{ plan: String, limitBytes: Number }],
    default: [
      { plan: 'Starter', limitBytes: 2 * 1024 * 1024 * 1024 },
      { plan: 'Pro', limitBytes: 25 * 1024 * 1024 * 1024 },
      { plan: 'Agency', limitBytes: 100 * 1024 * 1024 * 1024 },
    ],
  },
}, { timestamps: true });

const KnowledgeAdminSettings = mongoose.model('KnowledgeAdminSettings', knowledgeAdminSettingsSchema);

module.exports = KnowledgeAdminSettings;
