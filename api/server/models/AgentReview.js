const mongoose = require('mongoose');

const agentReviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentListing', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  review: { type: String, default: '' },
  pros: { type: String, default: '' },
  cons: { type: String, default: '' },
}, { timestamps: true });

agentReviewSchema.index({ listing: 1, user: 1 }, { unique: true });
agentReviewSchema.index({ listing: 1, rating: -1 });

const AgentReview = mongoose.model('AgentReview', agentReviewSchema);

module.exports = AgentReview;
