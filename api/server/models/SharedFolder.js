const mongoose = require('mongoose');

const sharedFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedFolder', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: ['org', 'team'], default: 'org' },
    itemCount: { type: Number, default: 0 },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

sharedFolderSchema.index({ organization: 1, name: 1 });
sharedFolderSchema.index({ team: 1, name: 1 });

const SharedFolder = mongoose.model('SharedFolder', sharedFolderSchema);
module.exports = SharedFolder;
