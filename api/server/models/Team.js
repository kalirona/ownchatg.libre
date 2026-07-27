const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

teamSchema.index({ organization: 1, name: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
