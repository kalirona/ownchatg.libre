const mongoose = require('mongoose');

const brandingConfigSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', unique: true, sparse: true },
    tenantId: { type: String, unique: true, sparse: true, index: true },
    logo: { type: String },
    logoDark: { type: String },
    favicon: { type: String },
    primaryColor: { type: String, default: '#16a34a' },
    secondaryColor: { type: String, default: '#2563eb' },
    accentColor: { type: String, default: '#8b5cf6' },
    customDomain: { type: String },
    emailFromName: { type: String },
    emailFromAddress: { type: String },
    loginPage: {
      backgroundImage: { type: String },
      backgroundColor: { type: String },
      customCss: { type: String },
      title: { type: String },
      subtitle: { type: String },
    },
    dashboard: {
      appName: { type: String },
      appTitle: { type: String },
      logoHeight: { type: Number, default: 32 },
      customCss: { type: String },
    },
    emailTemplate: {
      headerColor: { type: String },
      footerText: { type: String },
      logoUrl: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const BrandingConfig = mongoose.model('BrandingConfig', brandingConfigSchema);
module.exports = BrandingConfig;
