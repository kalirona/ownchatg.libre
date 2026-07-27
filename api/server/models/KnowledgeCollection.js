const mongoose = require('mongoose');

const knowledgeCollectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeCollection', default: null, index: true },
    icon: { type: String, default: 'folder' },
    fileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

knowledgeCollectionSchema.index({ user: 1, parentId: 1, name: 1 });

const KnowledgeCollection = mongoose.model('KnowledgeCollection', knowledgeCollectionSchema);

module.exports = KnowledgeCollection;
