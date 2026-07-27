const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planTier: { type: String, enum: ['free', 'business', 'enterprise'], default: 'free' },
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      requireAdminApproval: { type: Boolean, default: false },
      maxTeams: { type: Number, default: 10 },
      maxMembers: { type: Number, default: 100 },
    },
    logo: { type: String },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
