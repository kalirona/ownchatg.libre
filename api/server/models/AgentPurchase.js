const mongoose = require('mongoose');

const agentPurchaseSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentListing', required: true, index: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'refunded', 'pending'], default: 'completed', index: true },
  installedAt: { type: Date },
}, { timestamps: true });

agentPurchaseSchema.index({ buyer: 1, listing: 1 }, { unique: true });
agentPurchaseSchema.index({ seller: 1, status: 1 });

const AgentPurchase = mongoose.model('AgentPurchase', agentPurchaseSchema);

module.exports = AgentPurchase;
