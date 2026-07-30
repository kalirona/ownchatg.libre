const fs = require('fs').promises;
const path = require('path');
const BaseImporter = require('./BaseImporter');

class FileImporter extends BaseImporter {
  static get displayName() { return 'File Upload'; }
  static get sourceType() { return 'file_upload'; }
  static get supportedMimeTypes() {
    return ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/markdown', 'text/csv', 'application/json'];
  }

  async validate(sourceConfig) {
    if (!sourceConfig.filePath) {
      return { valid: false, error: 'filePath is required' };
    }
    try {
      await fs.access(sourceConfig.filePath);
      return { valid: true };
    } catch {
      return { valid: false, error: `File not found: ${sourceConfig.filePath}` };
    }
  }

  async fetch(sourceConfig) {
    const filePath = sourceConfig.filePath;
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return {
      content: [{ text: buffer.toString('utf8'), page: null, sourceDoc: path.basename(filePath) }],
      attachments: [{ filename: path.basename(filePath), data: buffer, mimeType: sourceConfig.mimeType || 'application/octet-stream' }],
      metadata: { title: path.basename(filePath), originalName: sourceConfig.originalFilename || path.basename(filePath) },
    };
  }

  async normalize(payload) {
    let rawText = '';
    const segments = [];
    for (const seg of payload.content) {
      rawText += seg.text + '\n\n';
      segments.push(seg);
    }
    return { rawText: rawText.trim(), segments, metadata: payload.metadata };
  }

  async metadata(sourceConfig) {
    const filePath = sourceConfig.filePath;
    const stat = await fs.stat(filePath).catch(() => ({}));
    return {
      title: sourceConfig.originalFilename || path.basename(filePath),
      estimatedSize: stat.size || 0,
    };
  }
}

module.exports = FileImporter;
