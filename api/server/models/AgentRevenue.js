const mongoose = require('mongoose');

const agentRevenueSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentListing', required: true, index: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentPurchase', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  sellerPayout: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending', index: true },
  paidAt: { type: Date },
}, { timestamps: true });

agentRevenueSchema.index({ seller: 1, status: 1 });
agentRevenueSchema.index({ createdAt: -1 });

const AgentRevenue = mongoose.model('AgentRevenue', agentRevenueSchema);

module.exports = AgentRevenue;
