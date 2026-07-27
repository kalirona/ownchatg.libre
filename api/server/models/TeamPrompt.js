const mongoose = require('mongoose');

const teamPromptSchema = new mongoose.Schema(
  {
    promptGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'PromptGroup', required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: ['org', 'team'], default: 'org' },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

teamPromptSchema.index({ organization: 1, promptGroup: 1 }, { unique: true });
teamPromptSchema.index({ team: 1, promptGroup: 1 });

const TeamPrompt = mongoose.model('TeamPrompt', teamPromptSchema);
module.exports = TeamPrompt;
