# Monitoring & Production Setup

## Quick Start (Production Server)
```bash
# One-command production setup (cron, backups, log rotation)
sudo npm run setup:production

# Or with custom options
sudo bash scripts/setup-production.sh \
  --app-dir /opt/librechat \
  --backup-dir /var/backups/librechat \
  --domain https://yourdomain.com
```

## Health Check

### Shell Script
```bash
chmod +x scripts/monitoring/health-check.sh
./scripts/monitoring/health-check.sh https://yourdomain.com
```

### Server-Side (requires MONITORING_ENABLED=true)
The app includes a built-in health check scheduler that runs every 5 minutes (configurable via `MONITORING_INTERVAL_MS`). It checks:
- MongoDB connection
- Redis connection
- MeiliSearch health
- Disk space
- Memory usage
- Server uptime

Enable it by setting `MONITORING_ENABLED=true` in your `.env`.

### Admin API
After enabling, monitoring status is available at:
- `GET /api/admin/monitoring` — Current system health
- `POST /api/admin/monitoring/check-now` — Trigger immediate check
- `POST /api/admin/monitoring/backup` — Trigger backup
- `GET /api/admin/monitoring/backups` — List backup archives

### GitHub Actions (Scheduled)
A scheduled workflow runs health checks every 5 minutes against your production URL.
If a check fails, a GitHub issue is auto-created.
```bash
# Trigger manually
gh workflow run "Scheduled Health Check" -f target_url=https://yourdomain.com
```

## Cron Setup (Linux)
### Automated (recommended)
```bash
sudo bash scripts/setup-production.sh --no-runner
```

### Manual crontab
```bash
# Health check every 5 minutes
*/5 * * * * /path/to/scripts/monitoring/health-check.sh >> /var/log/health-check.log 2>&1

# Full backup daily at 2am
0 2 * * * /path/to/scripts/backup-full.sh -d /var/backups/librechat -u 'mongodb://...' >> /var/log/backup.log 2>&1

# MongoDB backup daily at 4am
0 4 * * * /path/to/scripts/backup-mongodb.sh -d /var/backups/librechat -u 'mongodb://...' >> /var/log/backup-mongodb.log 2>&1
```

## Database Backups

### Linux (Bash)
```bash
# Full backup (MongoDB + uploads + MeiliSearch + config)
bash scripts/backup-full.sh -u 'mongodb://...' -d ./backups -r 30

# MongoDB-only
bash scripts/backup-mongodb.sh -u 'mongodb://...' -d ./backups -r 30

# Restore from backup
bash scripts/restore-full.sh ./backups/full_LibreChat_2025-01-01_020000.tar.gz -u 'mongodb://...'
```

### Windows (PowerShell)
```powershell
.\scripts\backup-mongodb.ps1 -MongoUri "mongodb://..." -BackupDir ".\backups" -RetentionDays 30
.\scripts\backup-full.ps1 -MongoUri "mongodb://..." -BackupDir ".\backups" -RetentionDays 30
```

### GitHub Actions (Scheduled)
A scheduled workflow runs full backups daily at 3:00 AM UTC.
Artifacts are retained for 30 days.
```bash
# Trigger manually
gh workflow run "Scheduled Backup" -f backup_type=full
```

## CI/CD: Self-Hosted GitHub Actions Runner

### Setup
```bash
# Interactive setup (you'll be prompted for repo URL and token)
sudo bash scripts/setup-github-runner.sh

# Non-interactive
sudo bash scripts/setup-github-runner.sh \
  --url https://github.com/your-org/your-repo \
  --token YOUR_TOKEN \
  --labels production,linux
```

### GitHub Repo Settings
1. Go to: `Settings > Actions > Runners > New self-hosted runner`
2. Copy the registration token
3. Run the setup script with the token
4. The runner will appear in the "Runners" list

### Management
```bash
# Check runner status
sudo /opt/actions-runner/svc.sh status

# Start/Stop/Restart
sudo /opt/actions-runner/svc.sh {start|stop|restart}

# View runner logs
journalctl -u actions.runner.* -f
```

## Full Observability Stack
See `monitoring/README.md` for:
- **Sentry** — Error tracking (backend `@sentry/node` + frontend `@sentry/react`)
- **PostHog** — Product analytics (backend `posthog-node` + frontend `posthog-js`)
- **Better Stack** — Log drain endpoint at `POST /api/better-stack/log-drain`
- **UptimeRobot** — Status page at `GET /status` (HTML) and `GET /status/json`
- **Prometheus** — Enhanced metrics (queue jobs, provider health, HTTP, SSE, MongoDB)
- **Grafana** — Auto-provisioned dashboards via `monitoring/docker-compose.monitoring.yml`
- **Queue Monitoring** — BullMQ job counts at `GET /api/admin/queues/status`
- **Provider Health** — AI provider checks at `GET /api/admin/providers`

## Env Reference
| Variable | Default | Description |
|----------|---------|-------------|
| `MONITORING_ENABLED` | `false` | Enable server-side health check scheduler |
| `MONITORING_INTERVAL_MS` | `300000` | Health check interval (5 min) |
| `QUEUE_MONITORING_ENABLED` | `false` | Enable BullMQ queue metrics polling |
| `PROVIDER_HEALTH_ENABLED` | `false` | Enable AI provider health checks |
| `SENTRY_DSN` | - | Sentry backend DSN for error tracking |
| `POSTHOG_API_KEY` | - | PostHog API key for analytics |
| `BETTER_STACK_TOKEN` | - | Auth token for Better Stack log drain |
| `BACKUP_DIR` | `./backups` | Default backup directory |

## Uptime Monitoring
Recommended third-party services:
- [UptimeRobot](https://uptimerobot.com) (free tier: 50 monitors, 5-min intervals)
- [Better Uptime](https://betteruptime.com) (includes status page)
- [Pingdom](https://www.pingdom.com)
- [Checkly](https://www.checklyhq.com) (browser-based checks)

## Error Tracking
- Client errors are caught by React Error Boundaries and logged to console
- Server errors are logged via Winston to `logs/error-*.log` (daily rotation, 14-day retention)
- Set `DEBUG_LOGGING=true` for verbose debug logs
- Set `CONSOLE_JSON=true` for structured JSON log output (compatible with Logstash, Datadog, etc.)

## APM / Tracing
OpenTelemetry is integrated. Configure exporters via env vars:
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_SERVICE_NAME`
