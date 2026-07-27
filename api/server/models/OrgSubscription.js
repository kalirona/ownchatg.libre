const mongoose = require('mongoose');

const orgSubscriptionSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true, unique: true },
    planName: { type: String, required: true },
    planTier: { type: String, enum: ['free', 'business', 'enterprise'], default: 'free' },
    provider: { type: String, enum: ['lemon_squeezy', 'paypal', 'none'], default: 'none' },
    providerSubscriptionId: { type: String, index: true },
    providerCustomerId: { type: String },
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'incomplete', 'expired', 'trial'], default: 'trial' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    canceledAt: { type: Date },
    seats: { type: Number, default: 5 },
    maxSeats: { type: Number, default: 10 },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

const OrgSubscription = mongoose.model('OrgSubscription', orgSubscriptionSchema);
module.exports = OrgSubscription;
