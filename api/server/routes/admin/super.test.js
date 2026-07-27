const express = require('express');
const request = require('supertest');

/* ------------------------------------------------------------------ */
/*  Mock the entire AdminController so we never touch mongoose.        */
/*  Each handler fn returns a known default JSON response.             */
/* ------------------------------------------------------------------ */

const mockHandlerResponses = {
  getDashboardStats: {
    totalUsers: 42,
    activeSubscriptions: 3,
    totalRevenue: 5000,
    totalCreditsAwarded: 25000,
    totalBalanceOutstanding: 100000,
    balanceAccountCount: 15,
    recentTransactions: [],
  },
  getUserDetail: { user: { _id: 'u1', name: 'Test User', email: 'test@example.com', role: 'USER' }, balance: { tokenCredits: 500 }, subscriptions: [], recentTransactions: [] },
  updateUserRole: { user: { _id: 'u1', role: 'ADMIN' } },
  adjustCredits: { balance: { tokenCredits: 1500 } },
  getRevenue: { transactions: [{ amount: 100, creditsAwarded: 500, status: 'completed' }], stats: { totalRevenue: 100, totalCreditsAwarded: 500, completedCount: 1 }, pagination: { page: 1, limit: 50, total: 1, pages: 1 } },
  getSubscriptions: { subscriptions: [{ _id: 's1', status: 'active' }], stats: { total: 1, active: 1, canceled: 0 }, pagination: { page: 1, limit: 50, total: 1, pages: 1 } },
  cancelSubscription: { subscription: { _id: 's1', status: 'canceled' } },
  getProviders: { providers: [{ name: 'openAI', enabled: true }, { name: 'anthropic', enabled: true }] },
  getModels: { models: { gpt4: { name: 'GPT-4' } } },
  getAnnouncements: { announcements: [{ _id: 'a1', bannerId: 'b1', message: 'Test' }] },
  createAnnouncement: { announcement: { _id: 'a1', bannerId: 'b1', message: 'New' } },
  updateAnnouncement: { announcement: { _id: 'a1', message: 'Updated' } },
  deleteAnnouncement: { message: 'Announcement deleted' },
  getSystemHealth: { status: 'healthy', checks: { mongodb: { status: 'healthy', state: 'connected' }, server: { status: 'healthy' } }, timestamp: new Date().toISOString() },
  getFeatureFlags: { features: { balance: true, billing: false, registration: true, socialLogin: false, rateLimit: true } },
  getAuditLogs: { logs: [{ action: 'user.login', category: 'auth' }], total: 1, page: 1 },
  getLockedUsers: { users: [{ _id: 'u1', name: 'Locked User', email: 'locked@example.com', loginAttempts: 5, loginLockedUntil: new Date(Date.now() + 3600000).toISOString() }] },
  unlockUser: { success: true },
};

const mockCtrl = {};
for (const key of Object.keys(mockHandlerResponses)) {
  const response = mockHandlerResponses[key];
  mockCtrl[key] = jest.fn((req, res) => {
    if (key === 'createAnnouncement') {
      res.status(201).json(response);
    } else {
      res.json(response);
    }
  });
}

jest.mock('~/server/controllers/AdminController', () => mockCtrl);

jest.mock('~/server/middleware', () => ({
  requireJwtAuth: (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'ADMIN' };
    next();
  },
}));

jest.mock('~/server/middleware/roles/capabilities', () => ({
  requireCapability: () => (req, res, next) => next(),
  hasCapability: jest.fn().mockResolvedValue(true),
}));

/* ------------------------------------------------------------ */
/*  Helper: create a fresh Express app with the super route      */
/* ------------------------------------------------------------ */
let app;

function createApp() {
  delete require.cache[require.resolve('./super')];
  const router = require('./super');
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/admin/super', router);
  return testApp;
}

beforeEach(() => {
  jest.clearAllMocks();
  app = createApp();
});

/* ------------------------------------------------------------ */
/*  Tests                                                       */
/* ------------------------------------------------------------ */

describe('GET /api/admin/super/dashboard', () => {
  it('returns dashboard stats', async () => {
    const res = await request(app).get('/api/admin/super/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(42);
    expect(res.body.activeSubscriptions).toBe(3);
  });
});

describe('GET /api/admin/super/users/:id', () => {
  it('returns user detail', async () => {
    const res = await request(app).get('/api/admin/super/users/u1');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.balance.tokenCredits).toBe(500);
  });
});

describe('PATCH /api/admin/super/users/:id/role', () => {
  it('updates user role', async () => {
    const res = await request(app)
      .patch('/api/admin/super/users/u1/role')
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });
});

describe('POST /api/admin/super/credits/adjust', () => {
  it('adjusts credits', async () => {
    const res = await request(app)
      .post('/api/admin/super/credits/adjust')
      .send({ userId: 'u1', amount: 500, reason: 'grant' });
    expect(res.status).toBe(200);
    expect(res.body.balance.tokenCredits).toBe(1500);
  });
});

describe('GET /api/admin/super/revenue', () => {
  it('returns revenue data', async () => {
    const res = await request(app).get('/api/admin/super/revenue');
    expect(res.status).toBe(200);
    expect(res.body.stats.totalRevenue).toBe(100);
  });
});

describe('GET /api/admin/super/subscriptions', () => {
  it('returns subscriptions', async () => {
    const res = await request(app).get('/api/admin/super/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body.subscriptions).toHaveLength(1);
  });
});

describe('POST /api/admin/super/subscriptions/:id/cancel', () => {
  it('cancels a subscription', async () => {
    const res = await request(app).post('/api/admin/super/subscriptions/s1/cancel');
    expect(res.status).toBe(200);
    expect(res.body.subscription.status).toBe('canceled');
  });
});

describe('GET /api/admin/super/providers', () => {
  it('returns providers', async () => {
    const res = await request(app).get('/api/admin/super/providers');
    expect(res.status).toBe(200);
    expect(res.body.providers).toHaveLength(2);
  });
});

describe('GET /api/admin/super/models', () => {
  it('returns models', async () => {
    const res = await request(app).get('/api/admin/super/models');
    expect(res.status).toBe(200);
    expect(res.body.models.gpt4.name).toBe('GPT-4');
  });
});

describe('GET /api/admin/super/announcements', () => {
  it('returns announcements', async () => {
    const res = await request(app).get('/api/admin/super/announcements');
    expect(res.status).toBe(200);
    expect(res.body.announcements).toHaveLength(1);
  });
});

describe('POST /api/admin/super/announcements', () => {
  it('creates an announcement', async () => {
    const res = await request(app)
      .post('/api/admin/super/announcements')
      .send({ bannerId: 'b1', message: 'New' });
    expect(res.status).toBe(201);
    expect(res.body.announcement.bannerId).toBe('b1');
  });
});

describe('PUT /api/admin/super/announcements/:id', () => {
  it('updates an announcement', async () => {
    const res = await request(app)
      .put('/api/admin/super/announcements/a1')
      .send({ message: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.announcement.message).toBe('Updated');
  });
});

describe('DELETE /api/admin/super/announcements/:id', () => {
  it('deletes an announcement', async () => {
    const res = await request(app).delete('/api/admin/super/announcements/a1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Announcement deleted');
  });
});

describe('GET /api/admin/super/health', () => {
  it('returns system health', async () => {
    const res = await request(app).get('/api/admin/super/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('GET /api/admin/super/features', () => {
  it('returns feature flags', async () => {
    const res = await request(app).get('/api/admin/super/features');
    expect(res.status).toBe(200);
    expect(res.body.features.balance).toBe(true);
  });
});

describe('GET /api/admin/super/audit', () => {
  it('returns audit logs', async () => {
    const res = await request(app).get('/api/admin/super/audit');
    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
  });
});

describe('GET /api/admin/super/locked-users', () => {
  it('returns locked users list', async () => {
    const res = await request(app).get('/api/admin/super/locked-users');
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe('locked@example.com');
    expect(res.body.users[0].loginAttempts).toBe(5);
  });
});

describe('POST /api/admin/super/users/:id/unlock', () => {
  it('unlocks a locked user', async () => {
    const res = await request(app).post('/api/admin/super/users/u1/unlock');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
