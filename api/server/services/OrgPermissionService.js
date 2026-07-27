const OrganizationMember = require('~/server/models/OrganizationMember');
const TeamMember = require('~/server/models/TeamMember');

const ORG_ROLE_HIERARCHY = {
  owner: 100,
  admin: 80,
  billing_admin: 60,
  editor: 40,
  member: 30,
  viewer: 10,
};

const TEAM_ROLE_HIERARCHY = {
  lead: 100,
  editor: 40,
  member: 30,
  viewer: 10,
};

const ORG_PERMISSIONS = {
  manage_org: ['owner', 'admin'],
  manage_billing: ['owner', 'admin', 'billing_admin'],
  manage_members: ['owner', 'admin'],
  manage_teams: ['owner', 'admin'],
  invite_members: ['owner', 'admin', 'editor'],
  create_shared_content: ['owner', 'admin', 'editor', 'member'],
  view_org_content: ['owner', 'admin', 'billing_admin', 'editor', 'member', 'viewer'],
  remove_members: ['owner', 'admin'],
  delete_org: ['owner'],
};

const TEAM_PERMISSIONS = {
  manage_team: ['lead'],
  manage_team_members: ['lead'],
  edit_team_content: ['lead', 'editor'],
  view_team_content: ['lead', 'editor', 'member', 'viewer'],
  delete_team: ['lead'],
};

async function checkOrgPermission(orgId, userId, permission) {
  try {
    const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
    if (!member) return false;
    const allowedRoles = ORG_PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(member.role);
  } catch {
    return false;
  }
}

async function requireOrgPermission(orgId, userId, permission) {
  const allowed = await checkOrgPermission(orgId, userId, permission);
  if (!allowed) {
    const err = new Error('Insufficient permissions');
    err.statusCode = 403;
    throw err;
  }
}

async function checkTeamPermission(teamId, userId, permission) {
  try {
    const member = await TeamMember.findOne({ team: teamId, user: userId }).lean();
    if (!member) return false;
    const allowedRoles = TEAM_PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(member.role);
  } catch {
    return false;
  }
}

async function requireTeamPermission(teamId, userId, permission) {
  const allowed = await checkTeamPermission(teamId, userId, permission);
  if (!allowed) {
    const err = new Error('Insufficient team permissions');
    err.statusCode = 403;
    throw err;
  }
}

async function getOrgRoleLevel(orgId, userId) {
  const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
  if (!member) return 0;
  return ORG_ROLE_HIERARCHY[member.role] || 0;
}

async function getTeamRoleLevel(teamId, userId) {
  const member = await TeamMember.findOne({ team: teamId, user: userId }).lean();
  if (!member) return 0;
  return TEAM_ROLE_HIERARCHY[member.role] || 0;
}

async function isOrgAdmin(orgId, userId) {
  return checkOrgPermission(orgId, userId, 'manage_org');
}

async function isOrgMember(orgId, userId) {
  const member = await OrganizationMember.findOne({ organization: orgId, user: userId }).lean();
  return !!member;
}

module.exports = {
  ORG_PERMISSIONS,
  TEAM_PERMISSIONS,
  ORG_ROLE_HIERARCHY,
  TEAM_ROLE_HIERARCHY,
  checkOrgPermission,
  requireOrgPermission,
  checkTeamPermission,
  requireTeamPermission,
  getOrgRoleLevel,
  getTeamRoleLevel,
  isOrgAdmin,
  isOrgMember,
};
