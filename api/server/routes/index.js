const accessPermissions = require('./accessPermissions');
const assistants = require('./assistants');
const categories = require('./categories');
const adminAuth = require('./admin/auth');
const adminConfig = require('./admin/config');
const adminGrants = require('./admin/grants');
const adminGroups = require('./admin/groups');
const adminRoles = require('./admin/roles');
const adminSkills = require('./admin/skills');
const adminUsers = require('./admin/users');
const adminAuditLog = require('./admin/audit');
const adminSuper = require('./admin/super');
const adminMonitoring = require('./admin/monitoring');
const endpoints = require('./endpoints');
const staticRoute = require('./static');
const messages = require('./messages');
const memories = require('./memories');
const presets = require('./presets');
const projects = require('./projects');
const prompts = require('./prompts');
const skills = require('./skills');
const balance = require('./balance');
const actions = require('./actions');
const apiKeys = require('./apiKeys');
const banner = require('./banner');
const search = require('./search');
const models = require('./models');
const convos = require('./convos');
const config = require('./config');
const agents = require('./agents');
const roles = require('./roles');
const oauth = require('./oauth');
const files = require('./files');
const share = require('./share');
const tags = require('./tags');
const auth = require('./auth');
const keys = require('./keys');
const user = require('./user');
const mcp = require('./mcp');
const rum = require('./rum');
const billing = require('./billing');
const billingWebhooks = require('./billingWebhooks');
const imageGen = require('./imageGen');
const videoGen = require('./videoGen');
const knowledge = require('./knowledge');
const marketplace = require('./marketplace');
const notifications = require('./notifications');
const integrations = require('./integrations');
const organizations = require('./organizations');
const branding = require('./branding');
const workflows = require('./workflows');
const invites = require('./invites');
const sharedFolders = require('./sharedFolders');
const teamPrompts = require('./teamPrompts');
const teamAgents = require('./teamAgents');
const orgBilling = require('./orgBilling');
const costOptimizer = require('./costOptimizer');
const promptOptimizer = require('./promptOptimizer');
const agentMarketplace = require('./agentMarketplace');
const uptime = require('./uptime');
const betterStack = require('./betterStack');
const adminQueueMonitor = require('./admin/queueMonitor');
const adminProviderHealth = require('./admin/providerHealth');

module.exports = {
  costOptimizer,
  promptOptimizer,
  agentMarketplace,
  adminMonitoring,
  adminQueueMonitor,
  adminProviderHealth,
  uptime,
  betterStack,
  notifications,
  integrations,
  organizations,
  branding,
  workflows,
  invites,
  sharedFolders,
  teamPrompts,
  teamAgents,
  orgBilling,
  rum,
  billing,
  billingWebhooks,
  imageGen,
  videoGen,
  knowledge,
  marketplace,
  mcp,
  auth,
  adminAuth,
  adminConfig,
  adminGrants,
  adminGroups,
  adminRoles,
  adminSkills,
  adminUsers,
  adminAuditLog,
  adminSuper,
  keys,
  apiKeys,
  user,
  tags,
  roles,
  oauth,
  files,
  share,
  banner,
  agents,
  convos,
  search,
  config,
  models,
  prompts,
  projects,
  skills,
  actions,
  presets,
  balance,
  messages,
  memories,
  endpoints,
  assistants,
  categories,
  staticRoute,
  accessPermissions,
};
