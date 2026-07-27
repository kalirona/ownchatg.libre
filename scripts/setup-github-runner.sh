#!/bin/bash
# Install and configure a self-hosted GitHub Actions runner for production
# Usage: ./setup-github-runner.sh [options]
# Options:
#   --url <repo-url>     GitHub repository URL (default: from env GITHUB_REPO or prompt)
#   --token <token>      GitHub Actions runner registration token
#   --dir <path>         Runner installation directory (default: /opt/actions-runner)
#   --user <user>        System user for runner service (default: actions-runner)
#   --labels <labels>    Runner labels (default: production,linux)
#   --name <name>        Runner name (default: hostname)
#   --replace            Replace existing runner
#   -h, --help           Show this help

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

RUNNER_DIR="/opt/actions-runner"
RUNNER_USER="actions-runner"
RUNNER_LABELS="production,linux"
RUNNER_NAME=$(hostname)
GITHUB_REPO="${GITHUB_REPO:-}"
REPLACE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)     GITHUB_REPO="$2"; shift 2 ;;
    --token)   RUNNER_TOKEN="$2"; shift 2 ;;
    --dir)     RUNNER_DIR="$2"; shift 2 ;;
    --user)    RUNNER_USER="$2"; shift 2 ;;
    --labels)  RUNNER_LABELS="$2"; shift 2 ;;
    --name)    RUNNER_NAME="$2"; shift 2 ;;
    --replace) REPLACE=true; shift ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ "$EUID" -ne 0 ]; then
  err "This script must be run as root (sudo)"
  exit 1
fi

# ── Gather inputs ─────────────────────────────────────────────
if [ -z "${GITHUB_REPO:-}" ]; then
  warn "Enter the GitHub repository URL (e.g., https://github.com/your-org/your-repo):"
  read -r GITHUB_REPO
fi

if [ -z "${RUNNER_TOKEN:-}" ]; then
  warn "Enter the GitHub Actions runner registration token:"
  read -rs RUNNER_TOKEN
  echo ""
fi

RUNNER_URL="${GITHUB_REPO}"
RUNNER_SCOPE="repo"

# ── Install dependencies ──────────────────────────────────────
info "Installing dependencies..."
apt-get update -qq && apt-get install -y -qq curl jq 2>/dev/null || true

# ── Create runner user ────────────────────────────────────────
if ! id -u "$RUNNER_USER" &>/dev/null; then
  useradd -m -d "/home/${RUNNER_USER}" -s /bin/bash "$RUNNER_USER"
  log "Created user: ${RUNNER_USER}"
fi

# ── Download and install runner ───────────────────────────────
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/^v//' 2>/dev/null || echo "2.322.0")
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH="x64"
[ "$ARCH" = "aarch64" ] && ARCH="arm64"

DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${ARCH}-${RUNNER_VERSION}.tar.gz"

info "Downloading GitHub Actions runner v${RUNNER_VERSION} (${ARCH})..."
curl -sSL "$DOWNLOAD_URL" -o "runner.tar.gz"

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
tar -xzf "${TMP_DIR}/runner.tar.gz"
rm -rf "$TMP_DIR"
log "Runner extracted to ${RUNNER_DIR}"

# ── Configure runner ──────────────────────────────────────────
REPLACE_FLAG=""
[ "$REPLACE" = true ] && REPLACE_FLAG="--replace"

info "Configuring runner..."
sudo -u "$RUNNER_USER" ./config.sh \
  --url "$RUNNER_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "_work" \
  --unattended $REPLACE_FLAG

log "Runner configured: ${RUNNER_NAME}"

# ── Install as systemd service ───────────────────────────────
info "Installing systemd service..."
./svc.sh install "$RUNNER_USER"
./svc.sh start
log "Runner service started"

# ── Verify ────────────────────────────────────────────────────
sleep 2
if ./svc.sh status 2>/dev/null | grep -q "active (running)"; then
  log "GitHub Actions runner is running!"
else
  warn "Runner service may not be running. Check with: sudo ${RUNNER_DIR}/svc.sh status"
fi

echo ""
log "========================================"
log "  GitHub Actions Runner Setup Complete!"
log "========================================"
log "  Directory: ${RUNNER_DIR}"
log "  User:      ${RUNNER_USER}"
log "  Service:   ${RUNNER_DIR}/svc.sh {start|stop|status}"
log "========================================"
