const mongoose = require('mongoose');

const imageGenHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    provider: { type: String, required: true, index: true },
    model: { type: String, required: true },
    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: '' },
    aspectRatio: { type: String, default: '' },
    seed: { type: Number, default: null },
    numImages: { type: Number, default: 1 },
    images: [
      {
        filepath: { type: String, required: true },
        fileId: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
      },
    ],
    favorite: { type: Boolean, default: false, index: true },
    creditsCost: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

imageGenHistorySchema.index({ user: 1, createdAt: -1 });
imageGenHistorySchema.index({ user: 1, favorite: 1, createdAt: -1 });

const ImageGenHistory = mongoose.model('ImageGenHistory', imageGenHistorySchema);

module.exports = ImageGenHistory;
