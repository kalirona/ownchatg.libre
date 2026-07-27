#!/bin/bash
# One-command production server setup: cron jobs, backup directories, log rotation
# Usage: sudo ./setup-production.sh [options]
# Options:
#   --app-dir <path>         Application directory (default: /opt/librechat)
#   --app-user <user>        Application user (default: librechat)
#   --backup-dir <path>      Backup directory (default: /var/backups/librechat)
#   --mongo-uri <uri>        MongoDB URI (default: from .env)
#   --domain <domain>        Application domain (default: from .env or prompt)
#   --no-cron                Skip cron job installation
#   --no-runner              Skip GitHub Actions runner setup
#   --no-backup-dir          Skip backup directory creation
#   -h, --help              Show this help

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

# ── Defaults ──────────────────────────────────────────────────
APP_DIR="$(pwd)"
APP_USER="${SUDO_USER:-$(whoami)}"
BACKUP_DIR="/var/backups/librechat"
DOMAIN=""
INSTALL_CRON=true
INSTALL_RUNNER=false
SETUP_BACKUP_DIR=true
SKIP_ENV_CHECK=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)       APP_DIR="$2"; shift 2 ;;
    --app-user)      APP_USER="$2"; shift 2 ;;
    --backup-dir)    BACKUP_DIR="$2"; shift 2 ;;
    --mongo-uri)     MONGO_URI="$2"; shift 2 ;;
    --domain)        DOMAIN="$2"; shift 2 ;;
    --no-cron)       INSTALL_CRON=false; shift ;;
    --no-runner)     INSTALL_RUNNER=false; shift ;;
    --no-backup-dir) SETUP_BACKUP_DIR=false; shift ;;
    -h|--help)       sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ "$EUID" -ne 0 ] && [ "$INSTALL_CRON" = true ]; then
  warn "Some operations (crontab -u) may require root. Run with sudo if needed."
fi

echo ""
info "========================================"
info "  Production Server Setup"
info "========================================"
info "  App Dir:    ${APP_DIR}"
info "  App User:   ${APP_USER}"
info "  Backup Dir: ${BACKUP_DIR}"
info "  Cron:       ${INSTALL_CRON}"
info "  GitHub Runner: ${INSTALL_RUNNER}"
echo ""

# ── Load .env if present ──────────────────────────────────────
ENV_FILE="${APP_DIR}/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE" 2>/dev/null || true
  set +a
  log "Loaded environment from ${ENV_FILE}"
fi

MONGO_URI="${MONGO_URI:-${MONGO_URL:-}}"
[ -z "$DOMAIN" ] && DOMAIN="${DOMAIN:-${API_URL:-}}"
[ -z "$DOMAIN" ] && DOMAIN="${DOMAIN:-${ALLOWED_ORIGINS:-}}"

# ── 1. Create backup directory ────────────────────────────────
if [ "$SETUP_BACKUP_DIR" = true ]; then
  info "[1/4] Creating backup directory..."
  mkdir -p "$BACKUP_DIR"
  chmod 750 "$BACKUP_DIR"
  log "Backup directory: ${BACKUP_DIR}"
fi

# ── 2. Make scripts executable ────────────────────────────────
info "[2/4] Making scripts executable..."
for script in "$APP_DIR/scripts/"*.sh "$APP_DIR/scripts/monitoring/"*.sh; do
  if [ -f "$script" ]; then
    chmod +x "$script"
    log "  +x ${script}"
  fi
done

# ── 3. Install cron jobs ──────────────────────────────────────
if [ "$INSTALL_CRON" = true ]; then
  info "[3/4] Installing cron jobs..."

  CRON_FILE=$(mktemp)
  crontab -u "$APP_USER" -l 2>/dev/null > "$CRON_FILE" || true

  # Health check every 5 minutes
  if ! grep -q "health-check.sh" "$CRON_FILE" 2>/dev/null; then
    echo "*/5 * * * * ${APP_DIR}/scripts/monitoring/health-check.sh ${DOMAIN:-http://localhost:3080} 5000 >> /var/log/health-check.log 2>&1" >> "$CRON_FILE"
    log "Added health check cron (every 5 min)"
  else
    warn "Health check cron already exists, skipping"
  fi

  # Full backup daily at 2am
  if ! grep -q "backup-full.sh" "$CRON_FILE" 2>/dev/null; then
    if [ -n "$MONGO_URI" ]; then
      echo "0 2 * * * ${APP_DIR}/scripts/backup-full.sh -d ${BACKUP_DIR} -u '${MONGO_URI}' >> /var/log/backup.log 2>&1" >> "$CRON_FILE"
      log "Added full backup cron (daily at 2am)"
    else
      warn "MONGO_URI not set, skipping backup cron"
    fi
  else
    warn "Backup cron already exists, skipping"
  fi

  # MongoDB-only backup at 4am (lighter)
  if ! grep -q "backup-mongodb.sh" "$CRON_FILE" 2>/dev/null; then
    if [ -n "$MONGO_URI" ]; then
      echo "0 4 * * * ${APP_DIR}/scripts/backup-mongodb.sh -d ${BACKUP_DIR} -u '${MONGO_URI}' >> /var/log/backup-mongodb.log 2>&1" >> "$CRON_FILE"
      log "Added MongoDB backup cron (daily at 4am)"
    fi
  else
    warn "MongoDB backup cron already exists, skipping"
  fi

  # Prune old logs weekly
  if ! grep -q "logrotate" "$CRON_FILE" 2>/dev/null; then
    echo "0 6 * * 0 logrotate -f ${APP_DIR}/scripts/logrotate.conf >> /var/log/logrotate.log 2>&1" >> "$CRON_FILE"
  fi

  crontab -u "$APP_USER" "$CRON_FILE"
  rm -f "$CRON_FILE"
  log "Crontab installed for user '${APP_USER}'"
fi

# ── 4. Set up log rotation ────────────────────────────────────
info "[4/4] Setting up log rotation..."
LOGROTATE_CONF="${APP_DIR}/scripts/logrotate.conf"
if [ ! -f "$LOGROTATE_CONF" ]; then
  cat > "$LOGROTATE_CONF" << 'EOF'
/var/log/health-check.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}

/var/log/backup.log /var/log/backup-mongodb.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}

${APP_DIR}/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}
EOF
  sed -i "s|\${APP_DIR}|${APP_DIR}|g" "$LOGROTATE_CONF"
  log "Logrotate config created at ${LOGROTATE_CONF}"
else
  warn "Logrotate config already exists at ${LOGROTATE_CONF}"
fi

# ── 5. (Optional) Install GitHub Actions runner ──────────────
if [ "$INSTALL_RUNNER" = true ]; then
  info "[+] Installing GitHub Actions runner..."
  RUNNER_SCRIPT="${APP_DIR}/scripts/setup-github-runner.sh"
  if [ -f "$RUNNER_SCRIPT" ]; then
    bash "$RUNNER_SCRIPT" --dir /opt/actions-runner --user "$APP_USER"
  else
    err "Runner setup script not found: ${RUNNER_SCRIPT}"
  fi
fi

echo ""
log "========================================"
log "  Production setup complete!"
log "========================================"
log "  Cron jobs installed for user: ${APP_USER}"
log "  Backup directory: ${BACKUP_DIR}"
log "  Run 'crontab -u ${APP_USER} -l' to review"
log "========================================"
