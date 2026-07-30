const mongoose = require('mongoose');

const mediaHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    type: { type: String, enum: ['image', 'video'], required: true, index: true },
    preset: { type: String },
    quality: { type: String, required: true },
    style: { type: String },
    aspectRatio: { type: String, default: '1:1' },
    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: '' },
    seed: { type: Number, default: null },
    numImages: { type: Number, default: 1 },
    duration: { type: Number },
    motionStrength: { type: String },
    cameraMotion: { type: String },
    status: {
      type: String,
      enum: ['idle', 'queued', 'preparing', 'generating', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    provider: { type: String },
    model: { type: String },
    images: [{
      filepath: { type: String },
      fileId: { type: String },
      width: { type: Number },
      height: { type: Number },
    }],
    videos: [{
      filepath: { type: String },
      fileId: { type: String },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
    }],
    error: { type: String, default: null },
    favorite: { type: Boolean, default: false, index: true },
    creditsCost: { type: Number, default: 0 },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

mediaHistorySchema.index({ user: 1, createdAt: -1 });
mediaHistorySchema.index({ user: 1, type: 1, createdAt: -1 });
mediaHistorySchema.index({ user: 1, favorite: 1, createdAt: -1 });

const MediaHistory = mongoose.model('MediaHistory', mediaHistorySchema);

module.exports = MediaHistory;
