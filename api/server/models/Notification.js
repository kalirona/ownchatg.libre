const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    type: {
      type: String,
      enum: [
        'system_announcement',
        'billing_alert',
        'low_credit',
        'subscription_expiring',
        'mention',
        'welcome',
        'integration',
        'team_invite',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
