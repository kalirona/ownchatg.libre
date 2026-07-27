const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trigger', 'ai_prompt', 'image_generation', 'approval', 'publish', 'condition', 'delay', 'webhook'],
    required: true,
  },
  label: { type: String, default: '' },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, required: true },
}, { _id: true });

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    steps: [workflowStepSchema],
    isActive: { type: Boolean, default: true },
    isTemplate: { type: Boolean, default: false },
    tags: [{ type: String }],
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

workflowSchema.index({ createdBy: 1, createdAt: -1 });

const Workflow = mongoose.model('Workflow', workflowSchema);
module.exports = Workflow;
