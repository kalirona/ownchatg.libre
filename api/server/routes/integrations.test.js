const express = require('express');
const request = require('supertest');

const mockStateData = { userId: '507f1f77bcf86cd799439011' };

jest.mock('~/server/services/IntegrationOAuthService', () => ({
  getAuthorizationUrl: jest.fn((userId, provider) => {
    return { url: `https://provider.com/oauth?state=teststate`, state: 'teststate' };
  }),
  connectIntegration: jest.fn((userId, provider, code, redirectUri) => {
    return {
      _id: 'int1',
      user: userId,
      provider,
      enabled: true,
      providerUserId: 'ext123',
      providerEmail: 'user@provider.com',
      displayName: 'Connected User',
    };
  }),
  getIntegrationStatus: jest.fn((userId, provider) => {
    return {
      connected: true,
      enabled: true,
      providerUserId: 'ext123',
      providerEmail: 'user@provider.com',
      tokenExpired: false,
    };
  }),
  disconnectIntegration: jest.fn(),
  getDecryptedTokens: jest.fn((userId, provider) => {
    if (provider === 'github') {
      return { accessToken: 'old_token', refreshToken: null, tokenExpiresAt: null };
    }
    return { accessToken: 'valid_token', refreshToken: 'refresh_token', tokenExpiresAt: new Date(Date.now() + 3600000).toISOString() };
  }),
  refreshAccessToken: jest.fn((provider) => {
    return { accessToken: 'new_token', refreshToken: 'new_refresh', expiresIn: 3600 };
  }),
}));

jest.mock('~/server/services/IntegrationService', () => ({
  getUserIntegrations: jest.fn((userId) => {
    return [
      { _id: 'int1', provider: 'google_drive', enabled: true, displayName: 'My Drive', providerEmail: 'user@gmail.com' },
    ];
  }),
  getIntegration: jest.fn((userId, provider) => {
    return { _id: 'int1', provider, enabled: true, displayName: 'Test' };
  }),
  saveIntegration: jest.fn((userId, provider, data) => {
    return { _id: 'int1', provider, ...data };
  }),
  deleteIntegration: jest.fn(),
  handleWebhookEvent: jest.fn((provider, event, payload) => {
    return { received: true, provider, event };
  }),
}));

process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-min-8-chars';

jest.mock('~/server/models/Integration', () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'int1', enabled: true, provider: 'google_drive' }),
  findOneAndDelete: jest.fn().mockResolvedValue(true),
  findOne: jest.fn().mockImplementation((query) => ({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({
      _id: 'int1',
      user: '507f1f77bcf86cd799439011',
      provider: query.provider || 'google_drive',
      enabled: true,
      accessToken: 'encrypted_valid_token',
      refreshToken: 'encrypted_refresh_token',
      tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      providerUserId: 'ext123',
      providerEmail: 'user@provider.com',
    }),
  })),
  find: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock('~/cache/getLogStores', () => jest.fn(() => ({
  get: jest.fn((key) => {
    if (key === 'oauth_state_teststate') { return mockStateData; }
    return null;
  }),
  set: jest.fn(),
  delete: jest.fn(),
})));

jest.mock('~/server/middleware', () => ({
  requireJwtAuth: (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'ADMIN' };
    next();
  },
}));

let app;

function createApp() {
  delete require.cache[require.resolve('./integrations')];
  const router = require('./integrations');
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/integrations', router);
  return testApp;
}

beforeEach(() => {
  jest.clearAllMocks();
  app = createApp();
});

describe('GET /api/integrations', () => {
  it('lists integrations', async () => {
    const res = await request(app).get('/api/integrations');
    expect(res.status).toBe(200);
    expect(res.body.integrations).toHaveLength(1);
    expect(res.body.integrations[0].provider).toBe('google_drive');
  });
});

describe('GET /api/integrations/:provider', () => {
  it('returns a specific integration', async () => {
    const res = await request(app).get('/api/integrations/google_drive');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('google_drive');
  });
});

describe('PUT /api/integrations/:provider/config', () => {
  it('saves integration config', async () => {
    const res = await request(app)
      .put('/api/integrations/slack/config')
      .send({ config: { webhookUrl: 'https://hooks.slack.com/xxx' }, enabled: true });
    expect(res.status).toBe(200);
    expect(res.body.integration.config.webhookUrl).toBe('https://hooks.slack.com/xxx');
  });
});

describe('DELETE /api/integrations/:provider', () => {
  it('deletes an integration', async () => {
    const res = await request(app).delete('/api/integrations/slack');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/integrations/oauth/:provider/auth', () => {
  it('returns authorization URL for OAuth provider', async () => {
    const res = await request(app).get('/api/integrations/oauth/google_drive/auth');
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('https://provider.com/oauth');
    expect(res.body.state).toBe('teststate');
  });
});

describe('GET /api/integrations/oauth/:provider/callback', () => {
  it('exchanges code and returns popup script on success', async () => {
    const res = await request(app)
      .get('/api/integrations/oauth/google_drive/callback?code=testcode&state=teststate');
    expect(res.status).toBe(200);
    expect(res.text).toContain('oauth_callback');
    expect(res.text).toContain('"success":true');
  });

  it('returns error popup script when provider returns error', async () => {
    const res = await request(app)
      .get('/api/integrations/oauth/google_drive/callback?error=access_denied&state=teststate');
    expect(res.status).toBe(200);
    expect(res.text).toContain('"success":false');
    expect(res.text).toContain('access_denied');
  });
});

describe('GET /api/integrations/oauth/:provider/status', () => {
  it('returns OAuth connection status', async () => {
    const res = await request(app).get('/api/integrations/oauth/google_drive/status');
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.providerEmail).toBe('user@provider.com');
  });
});

describe('POST /api/integrations/oauth/:provider/disconnect', () => {
  it('disconnects an OAuth integration', async () => {
    const res = await request(app).post('/api/integrations/oauth/google_drive/disconnect');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/integrations/oauth/:provider/refresh', () => {
  it('refreshes tokens for providers with refresh tokens', async () => {
    const res = await request(app).post('/api/integrations/oauth/google_drive/refresh');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.expiresAt).toBeDefined();
  });

  it('returns 400 for providers without refresh tokens', async () => {
    const res = await request(app).post('/api/integrations/oauth/github/refresh');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('No refresh token');
  });
});

describe('POST /api/integrations/webhooks/zapier', () => {
  it('handles Zapier webhook events', async () => {
    const res = await request(app)
      .post('/api/integrations/webhooks/zapier')
      .send({ event: 'test', data: {} });
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});

describe('POST /api/integrations/webhooks/n8n', () => {
  it('handles n8n webhook events', async () => {
    const res = await request(app)
      .post('/api/integrations/webhooks/n8n')
      .send({ event: 'test', data: {} });
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
