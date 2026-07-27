#!/bin/bash
# Production Health Check Script
# Usage: ./health-check.sh [base_url] [threshold_ms]
# Example: ./health-check.sh https://ownchatgptbusiness.com 5000

BASE_URL="${1:-https://ownchatgptbusiness.com}"
THRESHOLD_MS="${2:-5000}"
LOG_FILE="/var/log/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

check_endpoint() {
  local endpoint="$1"
  local label="$2"
  local start=$(date +%s%N)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$endpoint" 2>/dev/null)
  local end=$(date +%s%N)
  local duration_ms=$(( (end - start) / 1000000 ))

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 500 ]; then
    if [ "$duration_ms" -lt "$THRESHOLD_MS" ]; then
      log "OK  $label (${duration_ms}ms, HTTP ${http_code})"
      return 0
    else
      log "WARN $label (${duration_ms}ms, HTTP ${http_code}) - exceeds threshold"
      return 0
    fi
  else
    log "FAIL $label (${duration_ms}ms, HTTP ${http_code})"
    return 1
  fi
}

log "=== Health Check Started ==="
log "Target: $BASE_URL"

failures=0

check_endpoint "/health" "Health Endpoint" || ((failures++))
check_endpoint "/livez" "Liveness" || ((failures++))
check_endpoint "/api/banner" "Banner API" || ((failures++))
check_endpoint "/api/config" "Config API" || ((failures++))

# Check marketing pages
check_endpoint "/" "Home Page" || ((failures++))
check_endpoint "/pricing" "Pricing Page" || ((failures++))

log "=== Health Check Complete ($failures failures) ==="
exit $failures
