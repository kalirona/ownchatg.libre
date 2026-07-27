const mongoose = require('mongoose');

const orgBalanceSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true, unique: true },
    tokenCredits: { type: Number, default: 0 },
    bonusCredits: { type: Number, default: 0 },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

const OrgBalance = mongoose.model('OrgBalance', orgBalanceSchema);
module.exports = OrgBalance;
