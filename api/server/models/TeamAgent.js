const mongoose = require('mongoose');

const teamAgentSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: ['org', 'team'], default: 'org' },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

teamAgentSchema.index({ organization: 1, agent: 1 }, { unique: true });
teamAgentSchema.index({ team: 1, agent: 1 });

const TeamAgent = mongoose.model('TeamAgent', teamAgentSchema);
module.exports = TeamAgent;
