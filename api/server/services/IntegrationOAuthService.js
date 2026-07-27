const crypto = require('crypto');
const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const { encrypt, decrypt } = require('~/server/utils/crypto');
const Integration = require('~/server/models/Integration');
const getLogStores = require('~/cache/getLogStores');

const STATE_TTL_MS = 10 * 60 * 1000;

const PROVIDER_CONFIGS = {
  google_drive: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    refreshUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    clientId: () => process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    extraParams: { access_type: 'offline', prompt: 'consent' },
    useBasicAuth: false,
    tokenContentType: 'application/x-www-form-urlencoded',
  },
  dropbox: {
    authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    refreshUrl: 'https://api.dropboxapi.com/oauth2/token',
    userInfoUrl: 'https://api.dropboxapi.com/2/users/get_current_account',
    scopes: ['account_info.read', 'files.metadata.read', 'files.content.read', 'files.content.write'],
    clientId: () => process.env.DROPBOX_CLIENT_ID,
    clientSecret: () => process.env.DROPBOX_CLIENT_SECRET,
    extraParams: { token_access_type: 'offline' },
    useBasicAuth: true,
    userInfoMethod: 'POST',
    tokenContentType: 'application/x-www-form-urlencoded',
  },
  onedrive: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    refreshUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['Files.ReadWrite.AppFolder', 'offline_access', 'User.Read'],
    clientId: () => process.env.ONEDRIVE_CLIENT_ID,
    clientSecret: () => process.env.ONEDRIVE_CLIENT_SECRET,
    extraParams: {},
    useBasicAuth: false,
    tokenContentType: 'application/x-www-form-urlencoded',
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
    scopes: ['repo', 'user:email'],
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    extraParams: {},
    useBasicAuth: false,
    tokenContentType: 'application/json',
    acceptHeader: 'application/json',
  },
  notion: {
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    userInfoUrl: 'https://api.notion.com/v1/users/me',
    scopes: [],
    clientId: () => process.env.NOTION_CLIENT_ID,
    clientSecret: () => process.env.NOTION_CLIENT_SECRET,
    extraParams: {},
    useBasicAuth: true,
    tokenContentType: 'application/json',
    userInfoHeaders: { 'Notion-Version': '2022-06-28' },
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    refreshUrl: 'https://slack.com/api/oauth.v2.access',
    userInfoUrl: 'https://slack.com/api/users.identity',
    scopes: ['channels:read', 'chat:write', 'files:read', 'files:write'],
    clientId: () => process.env.SLACK_CLIENT_ID,
    clientSecret: () => process.env.SLACK_CLIENT_SECRET,
    extraParams: {},
    useBasicAuth: false,
    tokenContentType: 'application/x-www-form-urlencoded',
  },
  discord: {
    authorizeUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    refreshUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    scopes: ['identify', 'email', 'guilds'],
    clientId: () => process.env.DISCORD_CLIENT_ID,
    clientSecret: () => process.env.DISCORD_CLIENT_SECRET,
    extraParams: {},
    useBasicAuth: false,
    tokenContentType: 'application/x-www-form-urlencoded',
  },
};

function getProviderConfig(provider) {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  const clientId = config.clientId();
  const clientSecret = config.clientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(`OAuth not configured for provider: ${provider}`);
  }
  return { ...config, resolvedClientId: clientId, resolvedClientSecret: clientSecret };
}

function generateStateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function storeState(state, userId) {
  const store = getLogStores('general');
  await store.set(`oauth_state_${state}`, { userId, createdAt: Date.now() }, STATE_TTL_MS);
}

async function verifyState(state, userId) {
  const store = getLogStores('general');
  const data = await store.get(`oauth_state_${state}`);
  if (!data) {
    return false;
  }
  await store.delete(`oauth_state_${state}`);
  return data.userId === userId;
}

function getAuthorizationUrl(provider, userId) {
  const cfg = getProviderConfig(provider);
  const state = generateStateToken();
  const redirectUri = `${process.env.BASE_URL || 'http://localhost:3080'}/api/integrations/oauth/${provider}/callback`;

  const params = new URLSearchParams({
    client_id: cfg.resolvedClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: cfg.scopes.join(' '),
    ...cfg.extraParams,
  });

  storeState(state, userId);

  return { url: `${cfg.authorizeUrl}?${params.toString()}`, state };
}

async function exchangeCode(provider, code, redirectUri) {
  const cfg = getProviderConfig(provider);
  const headers = { Accept: cfg.acceptHeader || 'application/json' };
  const data = new URLSearchParams({
    code,
    client_id: cfg.resolvedClientId,
    client_secret: cfg.resolvedClientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  if (cfg.useBasicAuth) {
    const basic = Buffer.from(`${cfg.resolvedClientId}:${cfg.resolvedClientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  const response = await axios.post(cfg.tokenUrl, data.toString(), {
    headers: { 'Content-Type': cfg.tokenContentType, ...headers },
  });

  const tokens = response.data;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresIn: tokens.expires_in || null,
    raw: tokens,
  };
}

async function refreshAccessToken(provider, currentRefreshToken) {
  const cfg = getProviderConfig(provider);
  if (!cfg.refreshUrl) {
    return null;
  }

  const headers = { Accept: 'application/json' };
  const data = new URLSearchParams({
    refresh_token: currentRefreshToken,
    grant_type: 'refresh_token',
    client_id: cfg.resolvedClientId,
    client_secret: cfg.resolvedClientSecret,
  });

  if (cfg.useBasicAuth) {
    const basic = Buffer.from(`${cfg.resolvedClientId}:${cfg.resolvedClientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  const response = await axios.post(cfg.refreshUrl, data.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
  });

  const tokens = response.data;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || currentRefreshToken,
    expiresIn: tokens.expires_in || null,
  };
}

async function getUserInfo(provider, accessToken) {
  const cfg = getProviderConfig(provider);
  const headers = { Authorization: `Bearer ${accessToken}`, ...(cfg.userInfoHeaders || {}) };

  if (cfg.userInfoMethod === 'POST') {
    const response = await axios.post(cfg.userInfoUrl, {}, { headers });
    return response.data;
  }

  const response = await axios.get(cfg.userInfoUrl, { headers });

  if (provider === 'github') {
    let email = response.data.email;
    if (!email && cfg.emailsUrl) {
      const emailsRes = await axios.get(cfg.emailsUrl, { headers });
      const emails = emailsRes.data;
      const primary = emails.find((e) => e.primary);
      email = primary ? primary.email : (emails[0]?.email || null);
    }
    return {
      id: String(response.data.id),
      name: response.data.name || response.data.login,
      email,
      avatar_url: response.data.avatar_url,
    };
  }

  if (provider === 'notion') {
    const bot = response.data;
    return {
      id: bot.id,
      name: bot.name || bot.bot?.owner?.user?.name || 'Notion Bot',
      email: bot.bot?.owner?.user?.email || null,
      avatar_url: bot.bot?.owner?.user?.avatar_url || null,
    };
  }

  if (provider === 'slack') {
    const identity = response.data;
    return {
      id: identity.user?.id,
      name: identity.user?.name,
      email: identity.user?.email,
      avatar_url: identity.user?.image_192,
    };
  }

  if (provider === 'discord') {
    return {
      id: response.data.id,
      name: response.data.global_name || response.data.username,
      email: response.data.email,
      avatar_url: response.data.avatar
        ? `https://cdn.discordapp.com/avatars/${response.data.id}/${response.data.avatar}.png`
        : null,
    };
  }

  return {
    id: response.data.id,
    name: response.data.name,
    email: response.data.email,
    avatar_url: response.data.picture,
  };
}

async function connectIntegration(userId, provider, code, redirectUri) {
  const tokens = await exchangeCode(provider, code, redirectUri);
  const userInfo = await getUserInfo(provider, tokens.accessToken);

  const encryptedAccess = encrypt(tokens.accessToken);
  const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

  const integrationData = {
    user: userId,
    provider,
    enabled: true,
    accessToken: encryptedAccess,
    refreshToken: encryptedRefresh,
    tokenExpiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
    providerUserId: userInfo.id || null,
    providerEmail: userInfo.email || null,
    displayName: userInfo.name || provider,
    metadata: { avatarUrl: userInfo.avatar_url || null },
  };

  return Integration.findOneAndUpdate(
    { user: userId, provider },
    integrationData,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function disconnectIntegration(userId, provider) {
  await Integration.findOneAndDelete({ user: userId, provider });
}

async function getIntegrationStatus(userId, provider) {
  const integration = await Integration.findOne({ user: userId, provider })
    .select('+accessToken +refreshToken')
    .lean();
  if (!integration) {
    return { connected: false };
  }
  let isExpired = false;
  if (integration.tokenExpiresAt) {
    isExpired = new Date() > new Date(integration.tokenExpiresAt);
  }
  return {
    connected: true,
    enabled: integration.enabled,
    providerUserId: integration.providerUserId,
    providerEmail: integration.providerEmail,
    displayName: integration.displayName,
    tokenExpired: isExpired,
    expiresAt: integration.tokenExpiresAt,
  };
}

async function getDecryptedTokens(userId, provider) {
  const integration = await Integration.findOne({ user: userId, provider })
    .select('+accessToken +refreshToken')
    .lean();
  if (!integration || !integration.accessToken) {
    return null;
  }
  try {
    const accessToken = decrypt(integration.accessToken);
    const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : null;
    return { accessToken, refreshToken, tokenExpiresAt: integration.tokenExpiresAt };
  } catch (err) {
    logger.error('[IntegrationOAuthService] Token decryption failed', err);
    return null;
  }
}

async function ensureValidAccessToken(userId, provider) {
  const tokens = await getDecryptedTokens(userId, provider);
  if (!tokens) {
    return null;
  }
  if (tokens.tokenExpiresAt && new Date() > new Date(tokens.tokenExpiresAt)) {
    if (!tokens.refreshToken) {
      return null;
    }
    const cfg = PROVIDER_CONFIGS[provider];
    if (!cfg.refreshUrl) {
      return null;
    }
    const newTokens = await refreshAccessToken(provider, tokens.refreshToken);
    if (!newTokens) {
      return null;
    }
    const encryptedAccess = encrypt(newTokens.accessToken);
    const encryptedRefresh = newTokens.refreshToken ? encrypt(newTokens.refreshToken) : null;
    await Integration.findOneAndUpdate(
      { user: userId, provider },
      {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: newTokens.expiresIn ? new Date(Date.now() + newTokens.expiresIn * 1000) : null,
      },
    );
    return newTokens.accessToken;
  }
  return tokens.accessToken;
}

module.exports = {
  getProviderConfig,
  getAuthorizationUrl,
  verifyState,
  exchangeCode,
  refreshAccessToken,
  getUserInfo,
  connectIntegration,
  disconnectIntegration,
  getIntegrationStatus,
  getDecryptedTokens,
  ensureValidAccessToken,
};
