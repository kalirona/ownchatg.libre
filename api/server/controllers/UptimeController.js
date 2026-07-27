const os = require('os');
const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

const STATUS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>System Status</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f9fafb; color: #111827; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; }
  .healthy { background: #dcfce7; color: #166534; }
  .degraded { background: #fef9c3; color: #854d0e; }
  .unhealthy { background: #fce4ec; color: #c62828; }
  .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .card h3 { margin: 0 0 8px 0; font-size: 1rem; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .label { color: #6b7280; }
  .uptime { color: #6b7280; font-size: 0.875rem; margin-top: 24px; text-align: center; }
  a { color: #2563eb; text-decoration: none; }
</style>
</head>
<body>
<h1>System Status</h1>
<p>Last updated: {{TIMESTAMP}}</p>
<div class="card">
  <h3>API Server</h3>
  <div class="row"><span class="label">Status</span><span class="status {{API_STATUS_CLASS}}">{{API_STATUS}}</span></div>
  <div class="row"><span class="label">Uptime</span><span>{{UPTIME}}</span></div>
  <div class="row"><span class="label">Version</span><span>{{VERSION}}</span></div>
</div>
<div class="card">
  <h3>Database</h3>
  <div class="row"><span class="label">MongoDB</span><span class="status {{DB_STATUS_CLASS}}">{{DB_STATUS}}</span></div>
</div>
<div class="card">
  <h3>Services</h3>
  <div class="row"><span class="label">Memory Usage</span><span>{{MEMORY_USAGE}}</span></div>
  <div class="row"><span class="label">Load Average</span><span>{{LOAD_AVERAGE}}</span></div>
</div>
<div class="uptime">
  <a href="/">Home</a> &middot; <a href="/api/branding/status">API Status</a> &middot; {{TIMESTAMP}}
</div>
</body>
</html>`;

const getStatusPage = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbHealthy = dbState === 1;
    const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
    const uptime = Math.floor(process.uptime());

    const uptimeStr = uptime > 86400
      ? `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      : uptime > 3600
        ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
        : `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

    const html = STATUS_HTML
      .replace(/\{\{TIMESTAMP\}\}/g, new Date().toISOString())
      .replace(/\{\{API_STATUS\}\}/g, 'Healthy')
      .replace(/\{\{API_STATUS_CLASS\}\}/g, 'healthy')
      .replace(/\{\{UPTIME\}\}/g, uptimeStr)
      .replace(/\{\{VERSION\}\}/g, process.env.npm_package_version || 'v0.8.7')
      .replace(/\{\{DB_STATUS\}\}/g, dbHealthy ? 'Connected' : 'Disconnected')
      .replace(/\{\{DB_STATUS_CLASS\}\}/g, dbHealthy ? 'healthy' : 'unhealthy')
      .replace(/\{\{MEMORY_USAGE\}\}/g, `${memoryUsage} MB RSS`)
      .replace(/\{\{LOAD_AVERAGE\}\}/g, os.loadavg().map((n) => n.toFixed(2)).join(', '));

    res.type('html').send(html);
  } catch (err) {
    logger.error('[UptimeController] getStatusPage error:', err);
    res.status(500).send('Status page unavailable');
  }
};

const getJsonStatus = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    server: {
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'v0.8.7',
      node: process.version,
      platform: process.platform,
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
      },
      loadAverage: os.loadavg(),
    },
    mongodb: {
      status: states[dbState] || 'unknown',
      readyState: dbState,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getStatusPage,
  getJsonStatus,
};
