const { logger } = require('@librechat/data-schemas');
const brandingService = require('~/server/services/BrandingService');

async function getBrandingConfig(req, res) {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    const organizationId = req.query.organizationId;
    const config = await brandingService.getBranding(tenantId, organizationId);
    res.json(config);
  } catch (error) {
    logger.error('[BrandingController] getBrandingConfig', error);
    res.status(500).json({ message: 'Error fetching branding config' });
  }
}

async function publicBranding(req, res) {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const config = await brandingService.getBranding(tenantId);
    const safe = {
      logo: config.logo,
      logoDark: config.logoDark,
      favicon: config.favicon,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      loginPage: {
        backgroundImage: config.loginPage?.backgroundImage,
        backgroundColor: config.loginPage?.backgroundColor,
        title: config.loginPage?.title,
        subtitle: config.loginPage?.subtitle,
      },
      dashboard: {
        appName: config.dashboard?.appName,
        appTitle: config.dashboard?.appTitle,
        logoHeight: config.dashboard?.logoHeight,
      },
    };
    res.json(safe);
  } catch (error) {
    logger.error('[BrandingController] publicBranding', error);
    res.status(500).json({ message: 'Error fetching branding' });
  }
}

async function updateBranding(req, res) {
  try {
    const tenantId = req.user?.tenantId;
    const organizationId = req.body.organizationId || req.query.organizationId;
    const config = await brandingService.upsertBranding(tenantId, organizationId, req.body);
    res.json({ branding: config });
  } catch (error) {
    logger.error('[BrandingController] updateBranding', error);
    res.status(500).json({ message: 'Error updating branding' });
  }
}

async function resetBranding(req, res) {
  try {
    const tenantId = req.user?.tenantId;
    const organizationId = req.params.organizationId;
    await brandingService.deleteBranding(tenantId, organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[BrandingController] resetBranding', error);
    res.status(500).json({ message: 'Error resetting branding' });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const type = req.params.type;
    const allowed = ['logo', 'logoDark', 'favicon', 'backgroundImage'];
    if (!allowed.includes(type)) return res.status(400).json({ message: 'Invalid image type' });
    const tenantId = req.user?.tenantId;
    const organizationId = req.body.organizationId || req.query.organizationId;
    const result = await brandingService.uploadBrandingImage(
      tenantId, organizationId,
      type === 'backgroundImage' ? 'loginPage.backgroundImage' : type,
      req.file,
    );
    res.json(result);
  } catch (error) {
    logger.error('[BrandingController] uploadImage', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
}

async function verifyDomain(req, res) {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: 'Domain is required' });
    const result = await brandingService.verifyDomain(domain);
    res.json(result);
  } catch (error) {
    logger.error('[BrandingController] verifyDomain', error);
    res.status(500).json({ message: 'Error verifying domain' });
  }
}

async function checkSSLStatus(req, res) {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ message: 'Domain query param is required' });
    const result = await brandingService.checkSSL(domain);
    res.json(result);
  } catch (error) {
    logger.error('[BrandingController] checkSSLStatus', error);
    res.status(500).json({ message: 'Error checking SSL' });
  }
}

async function getStatus(req, res) {
  try {
    const status = await brandingService.getPublicStatus();
    res.json(status);
  } catch (error) {
    logger.error('[BrandingController] getStatus', error);
    res.status(500).json({ message: 'Error fetching status' });
  }
}

async function getApiDocs(req, res) {
  try {
    const branding = await brandingService.getBranding(req.headers['x-tenant-id']);
    const appName = branding?.dashboard?.appName || 'LibreChat';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3080';
    res.json({
      app: appName,
      version: process.env.APP_VERSION || '1.0.0',
      description: `${appName} API - white-label branded API`,
      endpoints: {
        branding: `${baseUrl}/api/branding`,
        auth: `${baseUrl}/api/auth`,
        conversations: `${baseUrl}/api/convos`,
        messages: `${baseUrl}/api/messages`,
        prompts: `${baseUrl}/api/prompts`,
        agents: `${baseUrl}/api/agents`,
        files: `${baseUrl}/api/files`,
        billing: `${baseUrl}/api/billing`,
        organizations: `${baseUrl}/api/organizations`,
        workflows: `${baseUrl}/api/workflows`,
      },
      authentication: 'Bearer token in Authorization header',
    });
  } catch (error) {
    logger.error('[BrandingController] getApiDocs', error);
    res.status(500).json({ message: 'Error' });
  }
}

module.exports = {
  getBrandingConfig,
  publicBranding,
  updateBranding,
  resetBranding,
  uploadImage,
  verifyDomain,
  checkSSLStatus,
  getStatus,
  getApiDocs,
};
