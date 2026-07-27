#!/bin/bash
# MongoDB-only backup with compression and retention pruning
# Usage: ./backup-mongodb.sh [options]
# Options:
#   -u, --mongo-uri <uri>    MongoDB connection URI
#   -d, --backup-dir <dir>   Backup directory (default: ./backups)
#   -r, --retention <days>   Retention days (default: 30)
#   -n, --db-name <name>     Database name (auto-detected from URI if omitted)
#   -h, --help               Show this help

set -euo pipefail

MONGO_URI="${MONGO_URI:-${MONGO_URL:-}}"
BACKUP_DIR="./backups"
RETENTION_DAYS=30
DB_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--mongo-uri)  MONGO_URI="$2"; shift 2 ;;
    -d|--backup-dir) BACKUP_DIR="$2"; shift 2 ;;
    -r|--retention)  RETENTION_DAYS="$2"; shift 2 ;;
    -n|--db-name)    DB_NAME="$2"; shift 2 ;;
    -h|--help)       sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$MONGO_URI" ]; then
  echo "ERROR: MONGO_URI not set. Usage: ./backup-mongodb.sh -u 'mongodb://...'" >&2
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
[ -z "$DB_NAME" ] && DB_NAME=$(echo "$MONGO_URI" | sed -n 's|.*/\([^/?]*\).*|\1|p')
[ -z "$DB_NAME" ] && DB_NAME="LibreChat"

BACKUP_PATH="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}"
mkdir -p "$BACKUP_PATH"

echo "Starting MongoDB backup of '${DB_NAME}'..."
echo "Target: ${BACKUP_PATH}"

if mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}" 2>&1; then
  echo "Backup completed successfully."
else
  echo "ERROR: mongodump failed" >&2
  exit 1
fi

ARCHIVE_PATH="${BACKUP_PATH}.tar.gz"
if tar -czf "$ARCHIVE_PATH" -C "$BACKUP_DIR" "${DB_NAME}_${TIMESTAMP}" 2>/dev/null; then
  rm -rf "$BACKUP_PATH"
  echo "Compressed to: ${ARCHIVE_PATH}"
fi

echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.tar.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete 2>/dev/null

echo "Backup complete. Retention: ${RETENTION_DAYS} days."
