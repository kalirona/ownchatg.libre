const mongoose = require('mongoose');

const agentListingSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  category: { type: String, default: 'general', index: true },
  tags: [{ type: String }],
  price: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerName: { type: String, default: '' },
  agentConfig: {
    provider: { type: String, default: 'openAI' },
    model: { type: String, default: 'gpt-4o-mini' },
    instructions: { type: String, default: '' },
    tools: [{ type: String }],
    skills: [{ type: String }],
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2048 },
  },
  version: { type: String, default: '1.0.0' },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft', index: true },
  featured: { type: Boolean, default: false, index: true },
  ratingAvg: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  installCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  revenueShare: { type: Number, default: 0.8 },
  isFree: { type: Boolean, default: true },
  previewImage: { type: String, default: '' },
  demoUrl: { type: String, default: '' },
  requiredKeys: [{ type: String }],
  compatibleEndpoints: [{ type: String }],
  changelog: [{
    version: String,
    date: Date,
    notes: String,
  }],
}, { timestamps: true });

agentListingSchema.index({ status: 1, ratingAvg: -1 });
agentListingSchema.index({ tags: 1 });
agentListingSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

const AgentListing = mongoose.model('AgentListing', agentListingSchema);

module.exports = AgentListing;
