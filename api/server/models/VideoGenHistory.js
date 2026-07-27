const mongoose = require('mongoose');

const videoGenHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    provider: { type: String, required: true, index: true },
    model: { type: String, required: true },
    prompt: { type: String, required: true },
    duration: { type: Number, default: 5 },
    aspectRatio: { type: String, default: '16:9' },
    quality: { type: String, default: 'standard' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    videos: [
      {
        filepath: { type: String, required: true },
        fileId: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
        duration: { type: Number },
      },
    ],
    error: { type: String, default: null },
    favorite: { type: Boolean, default: false, index: true },
    creditsCost: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

videoGenHistorySchema.index({ user: 1, createdAt: -1 });
videoGenHistorySchema.index({ user: 1, status: 1, createdAt: -1 });
videoGenHistorySchema.index({ user: 1, favorite: 1, createdAt: -1 });

const VideoGenHistory = mongoose.model('VideoGenHistory', videoGenHistorySchema);

module.exports = VideoGenHistory;
