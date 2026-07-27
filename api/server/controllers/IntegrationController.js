const { logger } = require('@librechat/data-schemas');
const integrationService = require('~/server/services/IntegrationService');
const oauthService = require('~/server/services/IntegrationOAuthService');
const Integration = require('~/server/models/Integration');
const getLogStores = require('~/cache/getLogStores');

async function listIntegrations(req, res) {
  try {
    const integrations = await integrationService.getUserIntegrations(req.user.id);
    res.json({ integrations });
  } catch (error) {
    logger.error('[IntegrationController] listIntegrations', error);
    res.status(500).json({ message: 'Error listing integrations' });
  }
}

async function getIntegration(req, res) {
  try {
    const integration = await integrationService.getIntegration(req.user.id, req.params.provider);
    if (!integration) { return res.status(404).json({ message: 'Integration not found' }); }
    const { accessToken, refreshToken, ...safe } = integration;
    res.json(safe);
  } catch (error) {
    logger.error('[IntegrationController] getIntegration', error);
    res.status(500).json({ message: 'Error fetching integration' });
  }
}

async function saveIntegrationConfig(req, res) {
  try {
    const { provider } = req.params;
    const { config, displayName, enabled } = req.body;
    const integration = await integrationService.saveIntegration(req.user.id, provider, {
      displayName,
      config,
      enabled,
    });
    res.json({ integration });
  } catch (error) {
    logger.error('[IntegrationController] saveIntegrationConfig', error);
    res.status(500).json({ message: 'Error saving integration' });
  }
}

async function deleteIntegration(req, res) {
  try {
    await integrationService.deleteIntegration(req.user.id, req.params.provider);
    res.json({ success: true });
  } catch (error) {
    logger.error('[IntegrationController] deleteIntegration', error);
    res.status(500).json({ message: 'Error deleting integration' });
  }
}

async function handleZapierWebhook(req, res) {
  try {
    const result = await integrationService.handleWebhookEvent('zapier', req.body.event, req.body);
    res.json(result);
  } catch (error) {
    logger.error('[IntegrationController] handleZapierWebhook', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
}

async function handleN8nWebhook(req, res) {
  try {
    const result = await integrationService.handleWebhookEvent('n8n', req.body.event, req.body);
    res.json(result);
  } catch (error) {
    logger.error('[IntegrationController] handleN8nWebhook', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
}

async function oauthAuthorize(req, res) {
  try {
    const { provider } = req.params;
    const { url, state } = oauthService.getAuthorizationUrl(provider, req.user.id);
    res.json({ url, state });
  } catch (error) {
    logger.error('[IntegrationController] oauthAuthorize', error);
    if (error.message?.includes('not configured')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error initiating OAuth' });
  }
}

async function oauthCallback(req, res) {
  try {
    const { provider } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.warn('[IntegrationController] OAuth error from provider', { provider, error: oauthError });
      return res.send(oauthPopupScript({ success: false, error: oauthError }));
    }

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing authorization code or state' });
    }

    const store = getLogStores('general');
    const stateData = await store.get(`oauth_state_${state}`);
    if (!stateData || !stateData.userId) {
      return res.status(400).json({ message: 'Invalid or expired OAuth state' });
    }
    const userId = stateData.userId;
    await store.delete(`oauth_state_${state}`);

    const redirectUri = `${process.env.BASE_URL || 'http://localhost:3080'}/api/integrations/oauth/${provider}/callback`;

    const integration = await oauthService.connectIntegration(userId, provider, code, redirectUri);
    logger.info('[IntegrationController] OAuth connected', { provider, userId });

    res.send(oauthPopupScript({ success: true, provider }));
  } catch (error) {
    logger.error('[IntegrationController] oauthCallback', error);
    res.send(oauthPopupScript({ success: false, error: error.message }));
  }
}

async function oauthStatus(req, res) {
  try {
    const { provider } = req.params;
    const status = await oauthService.getIntegrationStatus(req.user.id, provider);
    res.json(status);
  } catch (error) {
    logger.error('[IntegrationController] oauthStatus', error);
    res.status(500).json({ message: 'Error checking OAuth status' });
  }
}

async function oauthDisconnect(req, res) {
  try {
    const { provider } = req.params;
    await oauthService.disconnectIntegration(req.user.id, provider);
    res.json({ success: true });
  } catch (error) {
    logger.error('[IntegrationController] oauthDisconnect', error);
    res.status(500).json({ message: 'Error disconnecting integration' });
  }
}

async function oauthRefresh(req, res) {
  try {
    const { provider } = req.params;
    const tokens = await oauthService.getDecryptedTokens(req.user.id, provider);
    if (!tokens) {
      return res.status(404).json({ message: 'No tokens found for this integration' });
    }
    if (!tokens.refreshToken) {
      return res.status(400).json({ message: 'No refresh token available for this provider' });
    }
    const newTokens = await oauthService.refreshAccessToken(provider, tokens.refreshToken);
    if (!newTokens) {
      return res.status(500).json({ message: 'Token refresh failed' });
    }
    const { encrypt } = require('~/server/utils/crypto');
    const encryptedAccess = encrypt(newTokens.accessToken);
    const encryptedRefresh = newTokens.refreshToken ? encrypt(newTokens.refreshToken) : null;
    await Integration.findOneAndUpdate(
      { user: req.user.id, provider },
      {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: newTokens.expiresIn
          ? new Date(Date.now() + newTokens.expiresIn * 1000)
          : null,
      },
    );
    res.json({ success: true, expiresAt: newTokens.expiresIn ? new Date(Date.now() + newTokens.expiresIn * 1000) : null });
  } catch (error) {
    logger.error('[IntegrationController] oauthRefresh', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
}

function oauthPopupScript({ success, provider, error }) {
  const data = JSON.stringify({ success, provider, error: error || null });
  return `<!DOCTYPE html>
<html>
<head><title>OAuth Callback</title></head>
<body>
<script>
(function() {
  const data = ${data};
  if (window.opener) {
    window.opener.postMessage({ type: 'oauth_callback', ...data }, '*');
    window.close();
  } else {
    document.body.innerHTML = '<p>OAuth ' + (data.success ? 'successful' : 'failed') + '. You may close this window.</p>';
  }
})();
</script>
</body>
</html>`;
}

module.exports = {
  listIntegrations,
  getIntegration,
  saveIntegrationConfig,
  deleteIntegration,
  handleZapierWebhook,
  handleN8nWebhook,
  oauthAuthorize,
  oauthCallback,
  oauthStatus,
  oauthDisconnect,
  oauthRefresh,
};
