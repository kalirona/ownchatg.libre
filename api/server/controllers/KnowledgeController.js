const { logger } = require('@librechat/data-schemas');
const KnowledgeCollection = require('~/server/models/KnowledgeCollection');
const KnowledgeService = require('~/server/services/Knowledge/KnowledgeService');
const db = require('~/models');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const fileRecord = await KnowledgeService.uploadDocument(req, req.file);
    res.json({ file: fileRecord });
  } catch (error) {
    logger.error('[Knowledge] uploadDocument error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
}

async function listDocuments(req, res) {
  try {
    const { embedded, search } = req.query;
    const filter = { user: req.user.id };
    if (embedded === 'true') {
      filter.embedded = true;
    } else if (embedded === 'false') {
      filter.embedded = false;
    }
    if (search) {
      filter.filename = { $regex: search, $options: 'i' };
    }
    const files = await db.getFiles(filter, { createdAt: -1 });
    res.json({ files: files || [], total: (files || []).length });
  } catch (error) {
    logger.error('[Knowledge] listDocuments error:', error);
    res.status(500).json({ error: error.message || 'Failed to list documents' });
  }
}

async function deleteDocument(req, res) {
  try {
    const file = await db.deleteFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }
    await KnowledgeCollection.updateMany(
      { user: req.user.id },
      { $pull: { fileIds: file._id } },
    );
    res.json({ message: 'Document deleted' });
  } catch (error) {
    logger.error('[Knowledge] deleteDocument error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
}

async function getCollections(req, res) {
  try {
    const collections = await KnowledgeCollection.find({ user: req.user.id })
      .populate('fileIds', 'file_id filename type bytes embedded createdAt')
      .sort({ name: 1 });
    res.json({ collections });
  } catch (error) {
    logger.error('[Knowledge] getCollections error:', error);
    res.status(500).json({ error: error.message || 'Failed to get collections' });
  }
}

async function createCollection(req, res) {
  try {
    const { name, description, parentId, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    const collection = await KnowledgeCollection.create({
      user: req.user.id,
      name: name.trim(),
      description: description || '',
      parentId: parentId || null,
      icon: icon || 'folder',
      tenantId: req.user.tenantId,
    });
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] createCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to create collection' });
  }
}

async function updateCollection(req, res) {
  try {
    const { name, description, parentId, icon } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (parentId !== undefined) updates.parentId = parentId || null;
    if (icon !== undefined) updates.icon = icon;
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] updateCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to update collection' });
  }
}

async function deleteCollection(req, res) {
  try {
    const collection = await KnowledgeCollection.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    await KnowledgeCollection.updateMany(
      { user: req.user.id, parentId: collection._id },
      { $set: { parentId: null } },
    );
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    logger.error('[Knowledge] deleteCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete collection' });
  }
}

async function addFileToCollection(req, res) {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $addToSet: { fileIds: fileId } },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] addFileToCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to add file' });
  }
}

async function removeFileFromCollection(req, res) {
  try {
    const collection = await KnowledgeCollection.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $pull: { fileIds: req.params.fileId } },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ collection });
  } catch (error) {
    logger.error('[Knowledge] removeFileFromCollection error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove file' });
  }
}

async function search(req, res) {
  try {
    const { fileIds, query, k } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }
    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one fileId is required' });
    }
    const results = await KnowledgeService.searchDocuments({ fileIds, query, k, req });
    res.json({ results });
  } catch (error) {
    logger.error('[Knowledge] search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
}

async function chat(req, res) {
  try {
    const { message, fileIds } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one fileId is required' });
    }
    const result = await KnowledgeService.chatWithDocuments({ message, fileIds, req });
    res.json(result);
  } catch (error) {
    logger.error('[Knowledge] chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addFileToCollection,
  removeFileFromCollection,
  search,
  chat,
};
