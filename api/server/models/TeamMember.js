const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['lead', 'editor', 'viewer', 'member'], default: 'member' },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
module.exports = TeamMember;
