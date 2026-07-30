const BaseImporter = require('./BaseImporter');
const FileImporter = require('./FileImporter');

const registry = {
  [FileImporter.sourceType]: FileImporter,
};

/**
 * Register a new import provider.
 * @param {string} sourceType - Unique identifier
 * @param {typeof BaseImporter} importerClass - Class extending BaseImporter
 */
function registerProvider(sourceType, importerClass) {
  if (!(importerClass.prototype instanceof BaseImporter) && importerClass !== BaseImporter) {
    throw new Error(`Provider ${sourceType} must extend BaseImporter`);
  }
  registry[sourceType] = importerClass;
}

/**
 * Get an importer instance for the given source type.
 * @param {string} sourceType
 * @param {object} [config]
 * @returns {BaseImporter}
 */
function getImporter(sourceType, config = {}) {
  const ImporterClass = registry[sourceType];
  if (!ImporterClass) {
    throw new Error(`No importer registered for source type: ${sourceType}. ` +
      `Available: ${Object.keys(registry).join(', ')}`);
  }
  return new ImporterClass(config);
}

/**
 * List all registered provider source types.
 * @returns {Array<{sourceType: string, displayName: string}>}
 */
function listProviders() {
  return Object.entries(registry).map(([key, cls]) => ({
    sourceType: key,
    displayName: cls.displayName,
  }));
}

module.exports = {
  BaseImporter,
  FileImporter,
  registerProvider,
  getImporter,
  listProviders,
};
