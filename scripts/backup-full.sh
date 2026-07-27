#!/bin/bash
# Full production backup: MongoDB, uploaded files, MeiliSearch indexes, and config
# Usage: ./backup-full.sh [options]
# Options:
#   -u, --mongo-uri <uri>      MongoDB connection URI
#   -d, --backup-dir <dir>     Backup directory (default: ./backups)
#   -r, --retention <days>     Retention days (default: 30)
#   --uploads-dir <dir>        Uploads directory (default: ./uploads)
#   --meili-url <url>          MeiliSearch URL (default: http://localhost:7700)
#   --meili-key <key>          MeiliSearch master key
#   --config-dir <dir>         Config directory (default: .)
#   -h, --help                 Show this help

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────
MONGO_URI="${MONGO_URI:-${MONGO_URL:-}}"
BACKUP_DIR="./backups"
RETENTION_DAYS=30
UPLOADS_DIR="./uploads"
MEILI_URL="${MEILI_HOST:-http://localhost:7700}"
MEILI_KEY="${MEILI_MASTER_KEY:-${MEILI_SERVER_KEY:-}}"
CONFIG_DIR="."

# ── Parse arguments ───────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--mongo-uri)    MONGO_URI="$2"; shift 2 ;;
    -d|--backup-dir)   BACKUP_DIR="$2"; shift 2 ;;
    -r|--retention)    RETENTION_DAYS="$2"; shift 2 ;;
    --uploads-dir)     UPLOADS_DIR="$2"; shift 2 ;;
    --meili-url)       MEILI_URL="$2"; shift 2 ;;
    --meili-key)       MEILI_KEY="$2"; shift 2 ;;
    --config-dir)      CONFIG_DIR="$2"; shift 2 ;;
    -h|--help)         sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$MONGO_URI" ]; then
  echo "ERROR: MONGO_URI is not set. Provide --mongo-uri or set MONGO_URI env var." >&2
  exit 1
fi

# ── Prepare backup directory ──────────────────────────────────
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
DB_NAME=$(echo "$MONGO_URI" | sed -n 's|.*/\([^/?]*\).*|\1|p')
[ -z "$DB_NAME" ] && DB_NAME="LibreChat"
BACKUP_ROOT="${BACKUP_DIR}/full_${DB_NAME}_${TIMESTAMP}"
mkdir -p "$BACKUP_ROOT"

echo "=== Full backup to: ${BACKUP_ROOT} ==="

# ── 1. MongoDB ────────────────────────────────────────────────
MONGO_PATH="${BACKUP_ROOT}/mongodb"
mkdir -p "$MONGO_PATH"
echo "[1/4] Dumping MongoDB '${DB_NAME}'..."
if mongodump --uri="${MONGO_URI}" --out="${MONGO_PATH}" 2>&1; then
  echo "  MongoDB dump OK"
else
  echo "  WARNING: mongodump failed" >&2
fi

# ── 2. Uploads ────────────────────────────────────────────────
echo "[2/4] Copying uploads from '${UPLOADS_DIR}'..."
if [ -d "$UPLOADS_DIR" ]; then
  cp -a "$UPLOADS_DIR" "${BACKUP_ROOT}/uploads" 2>/dev/null && echo "  Uploads copied OK" || echo "  WARNING: uploads copy failed" >&2
else
  echo "  WARNING: Uploads directory '${UPLOADS_DIR}' not found, skipping." >&2
fi

# ── 3. MeiliSearch index dump ─────────────────────────────────
echo "[3/4] Exporting MeiliSearch indexes..."
MEILI_DEST="${BACKUP_ROOT}/meilisearch"
mkdir -p "$MEILI_DEST"

if [ -n "$MEILI_KEY" ]; then
  INDEXES=$(curl -sf -H "Authorization: Bearer ${MEILI_KEY}" "${MEILI_URL}/indexes" 2>/dev/null | jq -r '.results[].uid' 2>/dev/null) || INDEXES=""
  if [ -n "$INDEXES" ]; then
    for UID in $INDEXES; do
      if curl -sf -H "Authorization: Bearer ${MEILI_KEY}" "${MEILI_URL}/indexes/${UID}/documents" -o "${MEILI_DEST}/${UID}.json" 2>/dev/null; then
        echo "  Index '${UID}' exported"
      else
        echo "  WARNING: Failed to export index '${UID}'" >&2
      fi
    done
  else
    echo "  WARNING: No indexes found or MeiliSearch unreachable" >&2
  fi
else
  echo "  WARNING: MeiliSearch key not provided, skipping index export." >&2
fi

# ── 4. Config files ───────────────────────────────────────────
echo "[4/4] Copying config files..."
CONFIG_DEST="${BACKUP_ROOT}/config"
mkdir -p "$CONFIG_DEST"
for FILE in "librechat.yaml" ".env"; do
  if [ -f "${CONFIG_DIR}/${FILE}" ]; then
    cp -a "${CONFIG_DIR}/${FILE}" "${CONFIG_DEST}/${FILE}" && echo "  ${FILE} copied"
  else
    echo "  WARNING: ${FILE} not found at '${CONFIG_DIR}', skipping." >&2
  fi
done

# ── Compress ──────────────────────────────────────────────────
ARCHIVE_FILE="${BACKUP_ROOT}.tar.gz"
echo "Compressing to ${ARCHIVE_FILE} ..."
if tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "full_${DB_NAME}_${TIMESTAMP}" 2>/dev/null; then
  rm -rf "$BACKUP_ROOT"
  echo "Compressed OK: ${ARCHIVE_FILE}"
fi

# ── Prune old backups ─────────────────────────────────────────
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -maxdepth 1 -name "full_${DB_NAME}_*.tar.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete 2>/dev/null

echo "=== Backup complete ==="
