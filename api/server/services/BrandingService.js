const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const dns = require('dns');
const { logger } = require('@librechat/data-schemas');
const BrandingConfig = require('~/server/models/BrandingConfig');

const DEFAULTS = {
  primaryColor: '#16a34a',
  secondaryColor: '#2563eb',
  accentColor: '#8b5cf6',
  dashboard: { appName: 'LibreChat', appTitle: 'LibreChat' },
  loginPage: {},
  isActive: true,
};

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'branding');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

async function saveBrandingFile(file, type) {
  ensureUploadDir();
  const ext = path.extname(file.originalname) || '.png';
  const filename = `${type}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/branding/${filename}`;
}

async function deleteBrandingFile(url) {
  if (!url) return;
  const filename = path.basename(url);
  const filePath = path.join(UPLOAD_DIR, filename);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
}

async function getBranding(tenantId, organizationId) {
  try {
    let config;
    if (organizationId) {
      config = await BrandingConfig.findOne({ organization: organizationId, isActive: true }).lean();
    }
    if (!config && tenantId) {
      config = await BrandingConfig.findOne({ tenantId, isActive: true }).lean();
    }
    return config || { ...DEFAULTS };
  } catch (err) {
    logger.error('[BrandingService] getBranding', err);
    return { ...DEFAULTS };
  }
}

async function upsertBranding(tenantId, organizationId, data) {
  try {
    const filter = organizationId
      ? { organization: organizationId }
      : { tenantId };
    const config = await BrandingConfig.findOneAndUpdate(
      filter,
      { ...data, organization: organizationId, tenantId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return config;
  } catch (err) {
    logger.error('[BrandingService] upsertBranding', err);
    throw err;
  }
}

async function deleteBranding(tenantId, organizationId) {
  try {
    const filter = organizationId
      ? { organization: organizationId }
      : { tenantId };
    const config = await BrandingConfig.findOneAndDelete(filter).lean();
    if (config) {
      await deleteBrandingFile(config.logo);
      await deleteBrandingFile(config.logoDark);
      await deleteBrandingFile(config.favicon);
    }
  } catch (err) {
    logger.error('[BrandingService] deleteBranding', err);
  }
}

async function uploadBrandingImage(tenantId, organizationId, type, file) {
  try {
    const filter = organizationId ? { organization: organizationId } : { tenantId };
    const existing = await BrandingConfig.findOne(filter).lean();
    const url = await saveBrandingFile(file, type);
    const update = { [type]: url };
    if (type === 'logo' && existing?.logo) await deleteBrandingFile(existing.logo);
    if (type === 'logoDark' && existing?.logoDark) await deleteBrandingFile(existing.logoDark);
    if (type === 'favicon' && existing?.favicon) await deleteBrandingFile(existing.favicon);
    if (type === 'loginPage.backgroundImage' && existing?.loginPage?.backgroundImage) {
      await deleteBrandingFile(existing.loginPage.backgroundImage);
    }
    const config = await BrandingConfig.findOneAndUpdate(filter, update, { upsert: true, new: true });
    return { url, branding: config };
  } catch (err) {
    logger.error('[BrandingService] uploadBrandingImage', err);
    throw err;
  }
}

async function verifyDomain(customDomain) {
  try {
    const hostname = customDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const token = crypto.randomBytes(16).toString('hex');
    const expectedRecord = `librechat-verify=${token}`;
    return new Promise((resolve) => {
      dns.resolveTxt(hostname, (err, records) => {
        if (err) {
          resolve({ verified: false, token, error: 'DNS lookup failed: ' + err.message });
          return;
        }
        const flatRecords = records.flat().map((r) => r.replace(/"/g, ''));
        const match = flatRecords.find((r) => r.startsWith('librechat-verify='));
        if (match && match === expectedRecord) {
          resolve({ verified: true, token });
        } else {
          resolve({ verified: false, token, expected: expectedRecord, found: match || 'none' });
        }
      });
    });
  } catch (err) {
    logger.error('[BrandingService] verifyDomain', err);
    return { verified: false, error: err.message };
  }
}

async function checkSSL(customDomain) {
  try {
    const hostname = customDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return new Promise((resolve) => {
      const req = https.get(`https://${hostname}`, { rejectUnauthorized: true, timeout: 10000 }, (res) => {
        const cert = res.socket.getPeerCertificate();
        const valid = cert && Object.keys(cert).length > 0;
        resolve({
          valid,
          subject: cert?.subject?.CN || hostname,
          issuer: cert?.issuer?.O || 'Unknown',
          validFrom: cert?.valid_from,
          validTo: cert?.valid_to,
          expiresInDays: cert?.valid_to
            ? Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86400000)
            : null,
        });
      });
      req.on('error', (e) => resolve({ valid: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ valid: false, error: 'Connection timed out' }); });
    });
  } catch (err) {
    logger.error('[BrandingService] checkSSL', err);
    return { valid: false, error: err.message };
  }
}

async function getPublicStatus() {
  try {
    const appTitle = process.env.APP_TITLE || 'LibreChat';
    const appVersion = process.env.APP_VERSION || '1.0.0';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3080';
    return {
      app: appTitle,
      version: appVersion,
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      links: {
        api: `${baseUrl}/api`,
        health: `${baseUrl}/api/branding/status`,
        docs: `${baseUrl}/api/branding/docs`,
      },
    };
  } catch (err) {
    logger.error('[BrandingService] getPublicStatus', err);
    return { app: 'LibreChat', status: 'degraded' };
  }
}

async function getBrandingForEmail(tenantId, organizationId) {
  try {
    const branding = await getBranding(tenantId, organizationId);
    return {
      headerColor: branding.emailTemplate?.headerColor || branding.primaryColor || '#16a34a',
      footerText: branding.emailTemplate?.footerText || branding.dashboard?.appName || 'LibreChat',
      logoUrl: branding.emailTemplate?.logoUrl || branding.logo || '',
      appName: branding.dashboard?.appName || 'LibreChat',
    };
  } catch {
    return { headerColor: '#16a34a', footerText: 'LibreChat', logoUrl: '', appName: 'LibreChat' };
  }
}

module.exports = {
  getBranding,
  upsertBranding,
  deleteBranding,
  uploadBrandingImage,
  verifyDomain,
  checkSSL,
  getPublicStatus,
  getBrandingForEmail,
};
