const mongoose = require('mongoose');

const orgTransactionSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['subscription', 'credit_pack', 'allocation', 'usage', 'bonus', 'refund'], required: true },
    amount: { type: Number, required: true },
    credits: { type: Number, required: true },
    description: { type: String, default: '' },
    referenceId: { type: String, index: true },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

orgTransactionSchema.index({ organization: 1, createdAt: -1 });

const OrgTransaction = mongoose.model('OrgTransaction', orgTransactionSchema);
module.exports = OrgTransaction;
