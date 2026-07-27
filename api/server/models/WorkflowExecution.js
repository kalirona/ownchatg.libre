const mongoose = require('mongoose');

const stepResultSchema = new mongoose.Schema({
  stepId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval'],
    default: 'pending',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  input: { type: mongoose.Schema.Types.Mixed },
  output: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
}, { _id: false });

const workflowExecutionSchema = new mongoose.Schema(
  {
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'canceled', 'waiting_approval'],
      default: 'running',
    },
    triggerInput: { type: mongoose.Schema.Types.Mixed },
    finalOutput: { type: mongoose.Schema.Types.Mixed },
    stepResults: [stepResultSchema],
    currentStepIndex: { type: Number, default: 0 },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    error: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

workflowExecutionSchema.index({ workflow: 1, createdAt: -1 });

const WorkflowExecution = mongoose.model('WorkflowExecution', workflowExecutionSchema);
module.exports = WorkflowExecution;
