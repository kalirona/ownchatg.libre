const mongoose = require('mongoose');

const promptFavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromptGroup', required: true },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

promptFavoriteSchema.index({ user: 1, groupId: 1 }, { unique: true });
promptFavoriteSchema.index({ groupId: 1 });

const PromptFavorite = mongoose.model('PromptFavorite', promptFavoriteSchema);

module.exports = PromptFavorite;
