# Monitoring & Observability Stack

This directory contains configuration for the production monitoring stack.

## Quick Start

```bash
# Start Prometheus + Grafana + Node Exporter
docker compose -f monitoring/docker-compose.monitoring.yml up -d

# Access Grafana at http://localhost:3000 (admin/admin)
# Access Prometheus at http://localhost:9090
```

## Components

### 1. Sentry (Error Tracking)

**Backend:** `@sentry/node`
- Captures unhandled exceptions and Express errors
- Attaches user context when available
- Trims stack traces to 10 frames for performance

**Frontend:** `@sentry/react`
- Wraps React component tree with `Sentry.ErrorBoundary`
- Captures frontend exceptions with browser context
- Session replays (if enabled)

**Env Vars:**
| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | - | Sentry project DSN |
| `VITE_SENTRY_DSN` | - | Frontend Sentry DSN |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Environment tag |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Traces sampling rate (0-1) |
| `SENTRY_SAMPLE_RATE` | `1.0` | Error sample rate |

### 2. PostHog (Product Analytics)

**Backend:** `posthog-node`
- Server-side event capture
- Feature flag evaluation
- User identification & property tracking

**Frontend:** `posthog-js`
- Page views, page leaves
- Client-side events
- Feature flags

**Env Vars:**
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTHOG_API_KEY` | - | PostHog project API key |
| `VITE_POSTHOG_API_KEY` | - | Frontend PostHog key |
| `POSTHOG_HOST` | `https://app.posthog.com` | Self-hosted URL |
| `POSTHOG_FLUSH_AT` | `20` | Events before flush |
| `POSTHOG_FLUSH_INTERVAL` | `10000` | Flush interval (ms) |

### 3. Better Stack (Log Management)

**Log Drain Endpoint:** `POST /api/better-stack/log-drain`
- Accepts Better Stack's webhook log format
- Forwards to Winston logger
- Authenticated via `BETTER_STACK_TOKEN`

**Env Vars:**
| Variable | Default | Description |
|----------|---------|-------------|
| `BETTER_STACK_TOKEN` | - | Auth token for log drain |
| `CONSOLE_JSON` | `false` | JSON log output for Better Stack |

### 4. UptimeRobot (Status Page)

**Status Endpoint:** `GET /status` (HTML page), `GET /status/json` (JSON)
- Clean HTML status page
- JSON endpoint for UptimeRobot to poll
- Shows server, database, and memory status

Configure UptimeRobot to monitor:
- `https://yourdomain.com/health` — liveness
- `https://yourdomain.com/status` — status page
- `https://yourdomain.com/readyz` — readiness

### 5. Prometheus (Metrics)

**Enhanced Metrics** — all the existing prom-client metrics plus:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `queue_jobs_waiting` | Gauge | queue_name | Waiting jobs |
| `queue_jobs_active` | Gauge | queue_name | Active jobs |
| `queue_jobs_completed` | Gauge | queue_name | Completed jobs |
| `queue_jobs_failed` | Gauge | queue_name | Failed jobs |
| `queue_jobs_delayed` | Gauge | queue_name | Delayed jobs |
| `queue_jobs_paused` | Gauge | queue_name | Paused groups |
| `provider_health_status` | Gauge | provider | 1=healthy, 0=unhealthy |

### 6. Grafana (Dashboards)

**Auto-provisioned dashboards:**

- **LibreChat Overview**: HTTP rate, latency, queue jobs, provider health, SSE streams, memory, query duration, error rate

**Access:** `http://localhost:3000` (default: admin/admin)

### 7. Queue Monitoring

**Admin API:** `GET /api/admin/queues/status` and `GET /api/admin/queues/history`
- Real-time queue job counts
- History tracking (up to 1440 snapshots)
- Prometheus metrics integration

**Env Vars:**
| Variable | Default | Description |
|----------|---------|-------------|
| `QUEUE_MONITORING_ENABLED` | `false` | Enable queue metrics polling |
| `QUEUE_MONITOR_INTERVAL` | `30000` | Polling interval (ms) |

### 8. Provider Health Monitoring

Checks all configured AI providers every 5 minutes:
- OpenAI (api.openai.com)
- Anthropic (api.anthropic.com)
- Google AI (generativelanguage.googleapis.com)
- Azure OpenAI
- AWS Bedrock
- MeiliSearch

Sends `system_alert` notification on failures.

**Admin API:** `GET /api/admin/providers` and `POST /api/admin/providers/check-now`

**Env Vars:**
| Variable | Default | Description |
|----------|---------|-------------|
| `PROVIDER_HEALTH_ENABLED` | `false` | Enable provider health checks |
| `PROVIDER_HEALTH_CHECK_INTERVAL` | `300000` | Check interval (ms) |
| `PROVIDER_HEALTH_TIMEOUT` | `10000` | Per-provider timeout (ms) |

## Architecture

```
┌────────────────────────────────────────────┐
│              LibreChat App                  │
│  ┌──────────────────────────────────────┐  │
│  │  MonitoringService (health checks)   │  │
│  │  ProviderHealthService (AI providers)│  │
│  │  QueueMonitorService (BullMQ stats)  │  │
│  │  SentryService (error tracking)      │  │
│  │  PostHogService (analytics)          │  │
│  └──────────────────────────────────────┘  │
│                    │                        │
│  ┌──────────────────────────────────────┐  │
│  │  /metrics ──► Prometheus ◄── Grafana  │  │
│  │  /status  ──► UptimeRobot            │  │
│  │  /api/admin/* ──► Admin Dashboard     │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Docker Monitoring Stack

```bash
# Start full monitoring stack
docker compose -f monitoring/docker-compose.monitoring.yml up -d

# View logs
docker compose -f monitoring/docker-compose.monitoring.yml logs -f

# Stop
docker compose -f monitoring/docker-compose.monitoring.yml down
```

## Integrating with External Services

### Better Stack
1. Create a Log Tail source in Better Stack
2. Set the webhook URL to `https://yourdomain.com/api/better-stack/log-drain`
3. Set `BETTER_STACK_TOKEN` to match the webhook secret
4. Enable `CONSOLE_JSON=true` for structured logs

### UptimeRobot
1. Create monitors pointing to:
   - `https://yourdomain.com/health` (HTTP check, 5 min interval)
   - `https://yourdomain.com/readyz` (HTTP check)
2. Use the status page at `https://yourdomain.com/status` as an embedded status page

### Grafana Cloud
1. Replace `monitoring/prometheus/prometheus.yml` with Grafana Cloud's remote write config
2. Or use `docker-compose.monitoring.yml` with local Grafana

## Production Considerations

- **Metrics retention**: Prometheus defaults to 30 days in docker-compose
- **Security**: Grafana defaults to admin/admin — change via `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD`
- **Metrics auth**: `/metrics` endpoint is protected by `METRICS_SECRET` env var
- **Sentry sampling**: Start with 0.1 traces sample rate, increase if needed
- **PostHog**: Self-host PostHog for data sovereignty, or use PostHog Cloud
