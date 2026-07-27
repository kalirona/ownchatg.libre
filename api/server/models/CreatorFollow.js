const mongoose = require('mongoose');

const creatorFollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

creatorFollowSchema.index({ follower: 1, following: 1 }, { unique: true });
creatorFollowSchema.index({ following: 1 });

const CreatorFollow = mongoose.model('CreatorFollow', creatorFollowSchema);

module.exports = CreatorFollow;
