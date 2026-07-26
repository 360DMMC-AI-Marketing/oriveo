#!/bin/bash
# MongoDB Backup Script for Oriveo
# Usage: ./backup.sh [daily|weekly|manual]

set -euo pipefail

BACKUP_TYPE="${1:-daily}"
BACKUP_DIR="/root/oriveo/backups"
MONGO_CONTAINER="oriveo-mongodb-1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_TYPE}_${TIMESTAMP}"

mkdir -p "${BACKUP_PATH}"

echo "[backup] Starting ${BACKUP_TYPE} backup at $(date)"

docker exec "${MONGO_CONTAINER}" mongodump \
  --uri="mongodb://localhost:27017" \
  --db=oriveo \
  --out=/tmp/backup \
  --quiet

docker cp "${MONGO_CONTAINER}:/tmp/backup/oriveo" "${BACKUP_PATH}/oriveo"
docker exec "${MONGO_CONTAINER}" rm -rf /tmp/backup

cd "${BACKUP_PATH}" && tar -czf "../${BACKUP_TYPE}_${TIMESTAMP}.tar.gz" .
cd ..
rm -rf "${BACKUP_PATH}"

FINAL="${BACKUP_DIR}/${BACKUP_TYPE}_${TIMESTAMP}.tar.gz"
SIZE=$(du -h "${FINAL}" | cut -f1)
echo "[backup] Completed: ${FINAL} (${SIZE})"

find "${BACKUP_DIR}" -name "daily_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "weekly_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

echo "[backup] Cleanup done. Backups on disk:"
ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null || echo "(none)"
