/**
 * Base import provider interface.
 *
 * Every import source (file upload, website, YouTube, Drive, Notion, etc.)
 * implements this interface. The worker only calls fetch(), normalize(), metadata().
 * It never cares where content came from.
 */

class BaseImporter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Validate the source configuration.
   * @param {object} sourceConfig - Configuration specific to this provider
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validate(sourceConfig) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Fetch raw content from the source.
   * @param {object} sourceConfig
   * @param {object} context - { req, user, jobId }
   * @returns {Promise<ImportPayload>}
   */
  async fetch(sourceConfig, context) {
    throw new Error('fetch() must be implemented by subclass');
  }

  /**
   * Normalize the fetched content into a standard format.
   * @param {ImportPayload} payload - Output of fetch()
   * @returns {Promise<NormalizedContent>}
   */
  async normalize(payload) {
    throw new Error('normalize() must be implemented by subclass');
  }

  /**
   * Return metadata about the import.
   * @param {object} sourceConfig
   * @returns {Promise<ImportMetadata>}
   */
  async metadata(sourceConfig) {
    throw new Error('metadata() must be implemented by subclass');
  }

  /**
   * Cleanup any temporary resources.
   */
  async cleanup() {
    // Optional: override for temp file cleanup
  }

  /**
   * Human-readable name for this provider.
   */
  static get displayName() {
    return 'Base Importer';
  }

  /**
   * Unique identifier for this provider.
   */
  static get sourceType() {
    return 'base';
  }

  /**
   * Supported MIME types for file-based providers.
   */
  static get supportedMimeTypes() {
    return [];
  }
}

/**
 * @typedef {Object} ImportPayload
 * @property {Array<{text: string, page?: number, sourceDoc?: string}>} content - Extracted text segments
 * @property {Array<{filename: string, data: Buffer, mimeType: string}>} [attachments] - Attachments
 * @property {object} metadata - Source metadata (title, author, date, url, etc.)
 */

/**
 * @typedef {Object} NormalizedContent
 * @property {string} rawText - Combined text ready for chunking
 * @property {Array<{text: string, page?: number}>} segments - Segmented text with page references
 * @property {object} metadata - Enriched metadata
 */

/**
 * @typedef {Object} ImportMetadata
 * @property {string} title
 * @property {string} [description]
 * @property {string} [author]
 * @property {Date} [date]
 * @property {string} [url]
 * @property {number} [estimatedSize]
 * @property {string} [icon]
 */

module.exports = BaseImporter;
