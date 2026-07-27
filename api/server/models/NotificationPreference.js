const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  email: { type: Boolean, default: true },
  inApp: { type: Boolean, default: true },
  push: { type: Boolean, default: false },
  slack: { type: Boolean, default: false },
  discord: { type: Boolean, default: false },
}, { _id: false });

const typePreferencesSchema = new mongoose.Schema({
  welcome: { type: channelSchema, default: () => ({}) },
  billing_alert: { type: channelSchema, default: () => ({}) },
  low_credit: { type: channelSchema, default: () => ({}) },
  subscription_expiring: { type: channelSchema, default: () => ({}) },
  mention: { type: channelSchema, default: () => ({}) },
  team_invite: { type: channelSchema, default: () => ({}) },
  system_announcement: { type: channelSchema, default: () => ({}) },
  integration: { type: channelSchema, default: () => ({}) },
  workflow_finished: { type: channelSchema, default: () => ({}) },
  image_finished: { type: channelSchema, default: () => ({}) },
  video_finished: { type: channelSchema, default: () => ({}) },
}, { _id: false });

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  digest: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
  digestTime: { type: String, default: '09:00' },
  lastDigestSentAt: { type: Date },
  pushSubscription: { type: mongoose.Schema.Types.Mixed },
  channels: { type: channelSchema, default: () => ({}) },
  types: { type: typePreferencesSchema, default: () => ({}) },
}, { timestamps: true });

const NotificationPreference = mongoose.model('NotificationPreference', preferenceSchema);
module.exports = NotificationPreference;
