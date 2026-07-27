const mongoose = require('mongoose');

const organizationInviteSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

organizationInviteSchema.index({ email: 1, organization: 1 });
organizationInviteSchema.index({ token: 1 });

const OrganizationInvite = mongoose.model('OrganizationInvite', organizationInviteSchema);
module.exports = OrganizationInvite;
