const SharedFolder = require('~/server/models/SharedFolder');
const { logger } = require('@librechat/data-schemas');
const permService = require('~/server/services/OrgPermissionService');

async function getFolders(orgId, userId, teamId) {
  try {
    const isMember = await permService.isOrgMember(orgId, userId);
    if (!isMember) throw new Error('Not authorized');
    const filter = teamId ? { team: teamId } : { organization: orgId, team: null };
    return await SharedFolder.find(filter).sort({ name: 1 }).lean();
  } catch (err) {
    logger.error('[SharedFolderService] getFolders', err);
    throw err;
  }
}

async function createFolder(orgId, userId, { name, teamId, parentId }) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'create_shared_content');
    const folder = await SharedFolder.create({
      name,
      organization: orgId,
      team: teamId || null,
      parent: parentId || null,
      createdBy: userId,
      scope: teamId ? 'team' : 'org',
    });
    return folder;
  } catch (err) {
    logger.error('[SharedFolderService] createFolder', err);
    throw err;
  }
}

async function updateFolder(folderId, orgId, userId, updates) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'create_shared_content');
    const folder = await SharedFolder.findOneAndUpdate(
      { _id: folderId, organization: orgId },
      { name: updates.name },
      { new: true },
    ).lean();
    if (!folder) throw new Error('Folder not found');
    return folder;
  } catch (err) {
    logger.error('[SharedFolderService] updateFolder', err);
    throw err;
  }
}

async function deleteFolder(folderId, orgId, userId) {
  try {
    await permService.requireOrgPermission(orgId, userId, 'manage_teams');
    await SharedFolder.deleteMany({ $or: [{ _id: folderId }, { parent: folderId }], organization: orgId });
  } catch (err) {
    logger.error('[SharedFolderService] deleteFolder', err);
    throw err;
  }
}

module.exports = { getFolders, createFolder, updateFolder, deleteFolder };
