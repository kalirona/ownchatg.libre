#!/bin/bash
# Restore a full backup created by backup-full.sh
# Usage: ./restore-full.sh <archive> [options]
# Options:
#   -u, --mongo-uri <uri>    Target MongoDB URI (default: MONGO_URI env)
#   --uploads-dir <dir>      Target uploads directory (default: ./uploads)
#   --meili-url <url>        Target MeiliSearch URL (default: http://localhost:7700)
#   --meili-key <key>        Target MeiliSearch master key
#   --dry-run                Only list what would be restored
#   -h, --help               Show this help

set -euo pipefail

if [ $# -lt 1 ]; then
  sed -n '2,11p' "$0"
  exit 1
fi

ARCHIVE_PATH="$1"
shift

MONGO_URI="${MONGO_URI:-${MONGO_URL:-}}"
UPLOADS_DIR="./uploads"
MEILI_URL="${MEILI_HOST:-http://localhost:7700}"
MEILI_KEY="${MEILI_MASTER_KEY:-${MEILI_SERVER_KEY:-}}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--mongo-uri)  MONGO_URI="$2"; shift 2 ;;
    --uploads-dir)   UPLOADS_DIR="$2"; shift 2 ;;
    --meili-url)     MEILI_URL="$2"; shift 2 ;;
    --meili-key)     MEILI_KEY="$2"; shift 2 ;;
    --dry-run)       DRY_RUN=true; shift ;;
    -h|--help)       sed -n '2,11p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "ERROR: Archive not found: ${ARCHIVE_PATH}" >&2
  exit 1
fi

if [ -z "$MONGO_URI" ]; then
  echo "ERROR: MONGO_URI not set. Provide --mongo-uri or set MONGO_URI env var." >&2
  exit 1
fi

ARCHIVE_DIR=$(dirname "$ARCHIVE_PATH")
ARCHIVE_BASENAME=$(basename "$ARCHIVE_PATH" .tar.gz)

if [ "$DRY_RUN" = true ]; then
  echo "=== DRY RUN ==="
fi

echo "Extracting ${ARCHIVE_PATH} ..."
if [ "$DRY_RUN" = false ]; then
  tar -xzf "$ARCHIVE_PATH" -C "$ARCHIVE_DIR"
fi
RESTORE_ROOT="${ARCHIVE_DIR}/${ARCHIVE_BASENAME}"

if [ ! -d "$RESTORE_ROOT" ]; then
  echo "ERROR: Extracted directory not found: ${RESTORE_ROOT}" >&2
  exit 1
fi

echo "Restoring from: ${RESTORE_ROOT}"

# ── 1. MongoDB ────────────────────────────────────────────────
MONGO_PATH="${RESTORE_ROOT}/mongodb"
if [ -d "$MONGO_PATH" ]; then
  echo "[1/3] Restoring MongoDB..."
  if [ "$DRY_RUN" = true ]; then
    echo "  Would run: mongorestore --uri=... ${MONGO_PATH}"
  else
    if mongorestore --uri="${MONGO_URI}" "${MONGO_PATH}" 2>&1; then
      echo "  MongoDB restore OK"
    else
      echo "  WARNING: mongorestore failed" >&2
    fi
  fi
else
  echo "  WARNING: MongoDB dump not found in backup, skipping." >&2
fi

# ── 2. Uploads ────────────────────────────────────────────────
UPLOADS_SRC="${RESTORE_ROOT}/uploads"
if [ -d "$UPLOADS_SRC" ]; then
  echo "[2/3] Restoring uploads to ${UPLOADS_DIR}..."
  if [ "$DRY_RUN" = true ]; then
    echo "  Would copy: ${UPLOADS_SRC} -> ${UPLOADS_DIR}"
  else
    cp -a "${UPLOADS_SRC}/." "$UPLOADS_DIR" 2>/dev/null && echo "  Uploads restore OK" || echo "  WARNING: uploads restore failed" >&2
  fi
else
  echo "  WARNING: Uploads not found in backup, skipping." >&2
fi

# ── 3. MeiliSearch ────────────────────────────────────────────
MEILI_SRC="${RESTORE_ROOT}/meilisearch"
if [ -d "$MEILI_SRC" ] && [ -n "$MEILI_KEY" ]; then
  echo "[3/3] Restoring MeiliSearch indexes..."
  for JSON_FILE in "$MEILI_SRC"/*.json; do
    [ -f "$JSON_FILE" ] || continue
    INDEX_UID=$(basename "$JSON_FILE" .json)
    DOC_COUNT=$(jq -r 'length' "$JSON_FILE" 2>/dev/null || echo "?")
    if [ "$DRY_RUN" = true ]; then
      echo "  Would restore index '${INDEX_UID}' with ${DOC_COUNT} documents"
    else
      if curl -sf -X POST -H "Authorization: Bearer ${MEILI_KEY}" -H "Content-Type: application/json" --data-binary "@${JSON_FILE}" "${MEILI_URL}/indexes/${INDEX_UID}/documents" >/dev/null 2>&1; then
        echo "  Index '${INDEX_UID}' restored (${DOC_COUNT} docs)"
      else
        echo "  WARNING: Failed to restore index '${INDEX_UID}'" >&2
      fi
    fi
  done
elif [ -d "$MEILI_SRC" ]; then
  echo "  WARNING: MeiliSearch key not provided, skipping index restore." >&2
else
  echo "  WARNING: MeiliSearch dump not found in backup, skipping." >&2
fi

# ── Config files (extracted but NOT auto-restored) ───────────
CONFIG_SRC="${RESTORE_ROOT}/config"
if [ -d "$CONFIG_SRC" ]; then
  echo ""
  echo "Config files extracted to: ${CONFIG_SRC}" 
  echo "Review them manually before copying to production."
fi

echo "=== Restore complete ==="
