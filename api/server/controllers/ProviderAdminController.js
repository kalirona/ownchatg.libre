const { logger } = require('@librechat/data-schemas');
const routerService = require('~/server/services/AIRouterService');

async function getOverview(req, res) {
  try {
    const overview = await routerService.getDashboardOverview();
    res.json(overview);
  } catch (err) {
    logger.error('[ProviderAdminController] getOverview', err);
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
}

async function listProviders(req, res) {
  try {
    const { category, enabled } = req.query;
    const filter = {};
    if (category) { filter.category = category; }
    if (enabled !== undefined) { filter.enabled = enabled === 'true'; }
    const providers = await routerService.listProviders(filter);
    res.json(providers);
  } catch (err) {
    logger.error('[ProviderAdminController] listProviders', err);
    res.status(500).json({ message: 'Failed to list providers' });
  }
}

async function getProvider(req, res) {
  try {
    const provider = await routerService.getProvider(req.params.id);
    if (!provider) { return res.status(404).json({ message: 'Provider not found' }); }
    res.json(provider);
  } catch (err) {
    logger.error('[ProviderAdminController] getProvider', err);
    res.status(500).json({ message: 'Failed to get provider' });
  }
}

async function createProvider(req, res) {
  try {
    const provider = await routerService.createProvider(req.body);
    res.status(201).json(provider);
  } catch (err) {
    logger.error('[ProviderAdminController] createProvider', err);
    res.status(500).json({ message: 'Failed to create provider' });
  }
}

async function updateProvider(req, res) {
  try {
    const provider = await routerService.updateProvider(req.params.id, req.body);
    if (!provider) { return res.status(404).json({ message: 'Provider not found' }); }
    res.json(provider);
  } catch (err) {
    logger.error('[ProviderAdminController] updateProvider', err);
    res.status(500).json({ message: 'Failed to update provider' });
  }
}

async function deleteProvider(req, res) {
  try {
    await routerService.deleteProvider(req.params.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('[ProviderAdminController] deleteProvider', err);
    res.status(500).json({ message: 'Failed to delete provider' });
  }
}

async function listKeys(req, res) {
  try {
    const keys = await routerService.listProviderKeys(req.params.id);
    res.json(keys);
  } catch (err) {
    logger.error('[ProviderAdminController] listKeys', err);
    res.status(500).json({ message: 'Failed to list keys' });
  }
}

async function createKey(req, res) {
  try {
    const key = await routerService.createProviderKey(req.params.id, req.body, req.user.id);
    res.status(201).json(key);
  } catch (err) {
    logger.error('[ProviderAdminController] createKey', err);
    res.status(500).json({ message: 'Failed to create key' });
  }
}

async function testKey(req, res) {
  try {
    const result = await routerService.testProviderKey(req.params.keyId);
    res.json(result);
  } catch (err) {
    logger.error('[ProviderAdminController] testKey', err);
    res.status(500).json({ message: 'Failed to test key' });
  }
}

async function deleteKey(req, res) {
  try {
    await routerService.deleteProviderKey(req.params.keyId);
    res.json({ success: true });
  } catch (err) {
    logger.error('[ProviderAdminController] deleteKey', err);
    res.status(500).json({ message: 'Failed to delete key' });
  }
}

async function listModels(req, res) {
  try {
    const models = await routerService.listModels(req.params.id);
    res.json(models);
  } catch (err) {
    logger.error('[ProviderAdminController] listModels', err);
    res.status(500).json({ message: 'Failed to list models' });
  }
}

async function createModel(req, res) {
  try {
    const model = await routerService.createModel({ ...req.body, providerId: req.params.id });
    res.status(201).json(model);
  } catch (err) {
    logger.error('[ProviderAdminController] createModel', err);
    res.status(500).json({ message: 'Failed to create model' });
  }
}

async function updateModel(req, res) {
  try {
    const model = await routerService.updateModel(req.params.modelId, req.body);
    if (!model) { return res.status(404).json({ message: 'Model not found' }); }
    res.json(model);
  } catch (err) {
    logger.error('[ProviderAdminController] updateModel', err);
    res.status(500).json({ message: 'Failed to update model' });
  }
}

async function deleteModel(req, res) {
  try {
    await routerService.deleteModel(req.params.modelId);
    res.json({ success: true });
  } catch (err) {
    logger.error('[ProviderAdminController] deleteModel', err);
    res.status(500).json({ message: 'Failed to delete model' });
  }
}

async function listRoutingRules(req, res) {
  try {
    const { category } = req.query;
    const rules = await routerService.listRoutingRules(category);
    res.json(rules);
  } catch (err) {
    logger.error('[ProviderAdminController] listRoutingRules', err);
    res.status(500).json({ message: 'Failed to list rules' });
  }
}

async function createRoutingRule(req, res) {
  try {
    const rule = await routerService.createRoutingRule({ ...req.body, createdBy: req.user.id });
    res.status(201).json(rule);
  } catch (err) {
    logger.error('[ProviderAdminController] createRoutingRule', err);
    res.status(500).json({ message: 'Failed to create rule' });
  }
}

async function updateRoutingRule(req, res) {
  try {
    const rule = await routerService.updateRoutingRule(req.params.id, req.body);
    if (!rule) { return res.status(404).json({ message: 'Rule not found' }); }
    res.json(rule);
  } catch (err) {
    logger.error('[ProviderAdminController] updateRoutingRule', err);
    res.status(500).json({ message: 'Failed to update rule' });
  }
}

async function deleteRoutingRule(req, res) {
  try {
    await routerService.deleteRoutingRule(req.params.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('[ProviderAdminController] deleteRoutingRule', err);
    res.status(500).json({ message: 'Failed to delete rule' });
  }
}

async function getUsage(req, res) {
  try {
    const { providerId, days } = req.query;
    const stats = await routerService.getUsageStats(providerId, parseInt(days) || 30);
    res.json(stats);
  } catch (err) {
    logger.error('[ProviderAdminController] getUsage', err);
    res.status(500).json({ message: 'Failed to get usage' });
  }
}

async function getCosts(req, res) {
  try {
    const { days } = req.query;
    const costs = await routerService.getCostSummary(parseInt(days) || 30);
    res.json(costs);
  } catch (err) {
    logger.error('[ProviderAdminController] getCosts', err);
    res.status(500).json({ message: 'Failed to get costs' });
  }
}

async function getHealthHistory(req, res) {
  try {
    const { days } = req.query;
    const history = await routerService.getProviderHealthHistory(req.params.id, parseInt(days) || 7);
    res.json(history);
  } catch (err) {
    logger.error('[ProviderAdminController] getHealthHistory', err);
    res.status(500).json({ message: 'Failed to get health history' });
  }
}

async function getSystemDefaults(req, res) {
  try {
    const defaults = await routerService.getSystemDefaults();
    res.json(defaults);
  } catch (err) {
    logger.error('[ProviderAdminController] getSystemDefaults', err);
    res.status(500).json({ message: 'Failed to get system defaults' });
  }
}

async function upsertSystemDefault(req, res) {
  try {
    const def = await routerService.upsertSystemDefault(req.body);
    res.json(def);
  } catch (err) {
    logger.error('[ProviderAdminController] upsertSystemDefault', err);
    res.status(500).json({ message: 'Failed to update system default' });
  }
}

module.exports = {
  getOverview,
  listProviders, getProvider, createProvider, updateProvider, deleteProvider,
  listKeys, createKey, testKey, deleteKey,
  listModels, createModel, updateModel, deleteModel,
  listRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule,
  getUsage, getCosts, getHealthHistory,
  getSystemDefaults, upsertSystemDefault,
};
