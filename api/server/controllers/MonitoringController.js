const monitoringService = require('~/server/services/MonitoringService');
const { logger } = require('@librechat/data-schemas');

const getStatus = async (req, res) => {
  try {
    const cached = monitoringService.getCachedStatus();
    if (cached) {
      return res.json(cached);
    }
    const result = await monitoringService.runHealthCheck();
    res.json(result);
  } catch (err) {
    logger.error('[MonitoringController] getStatus error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const checkNow = async (req, res) => {
  try {
    const result = await monitoringService.runHealthCheck();
    res.json(result);
  } catch (err) {
    logger.error('[MonitoringController] checkNow error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const triggerBackup = async (req, res) => {
  const { type } = req.body || {};
  const script = type === 'mongodb' ? 'backup-mongodb.sh' : 'backup-full.sh';
  const scriptPath = `${__dirname}/../../scripts/${script}`;

  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ status: 'error', message: `Backup script not found: ${scriptPath}` });
  }

  const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
  const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
  const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || process.env.MEILI_SERVER_KEY || '';

  const child = require('child_process').spawn('bash', [scriptPath], {
    env: {
      ...process.env,
      MONGO_URI: MONGO_URI || '',
      MEILI_HOST,
      MEILI_MASTER_KEY,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: `${__dirname}/../../..`,
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => { stdout += data.toString(); });
  child.stderr.on('data', (data) => { stderr += data.toString(); });

  child.on('close', (code) => {
    if (code === 0) {
      logger.info(`[Monitoring] Backup completed (type=${type || 'full'})`);
      res.json({ status: 'ok', message: 'Backup completed', output: stdout.trim() });
    } else {
      logger.error(`[Monitoring] Backup failed (type=${type || 'full'}): ${stderr}`);
      res.status(500).json({ status: 'error', message: 'Backup failed', output: stderr.trim() });
    }
  });

  child.on('error', (err) => {
    logger.error('[Monitoring] Backup spawn error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  });
};

const listBackups = async (req, res) => {
  const backupDir = process.env.BACKUP_DIR || './backups';
  const fs = require('fs');
  const path = require('path');

  try {
    const absDir = path.resolve(backupDir);
    if (!fs.existsSync(absDir)) {
      return res.json({ status: 'ok', backups: [] });
    }
    const files = fs.readdirSync(absDir)
      .filter((f) => f.endsWith('.tar.gz'))
      .map((f) => {
        const stat = fs.statSync(path.join(absDir, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({ status: 'ok', backupDir: absDir, backups: files });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getStatus,
  checkNow,
  triggerBackup,
  listBackups,
};
