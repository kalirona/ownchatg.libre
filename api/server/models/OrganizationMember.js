const mongoose = require('mongoose');

const organizationMemberSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'billing_admin', 'editor', 'viewer', 'member'], default: 'member' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);
module.exports = OrganizationMember;
