const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: [
        'google_drive', 'dropbox', 'onedrive', 'notion',
        'slack', 'discord', 'zapier', 'n8n', 'wordpress', 'github',
      ],
      required: true,
    },
    displayName: { type: String },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed },
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiresAt: { type: Date },
    providerUserId: { type: String },
    providerEmail: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

integrationSchema.index({ user: 1, provider: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);
module.exports = Integration;
