#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEY="${BACKUP_ENCRYPTION_KEY:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BUCKET="${S3_BACKUP_BUCKET:-coop-launch-backups}"
mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

PG_URL="${DATABASE_URL%%\?*}"
OUT="$BACKUP_DIR/coop_launch_$STAMP.sql"
echo "Dumping database to $OUT"
if ! pg_dump "$PG_URL" --no-owner --format=plain > "$OUT"; then
  echo "pg_dump failed" >&2
  exit 2
fi

if [[ -z "$KEY" ]]; then
  echo "BACKUP_ENCRYPTION_KEY is required for encrypted backups" >&2
  exit 3
fi

ENCRYPTED="$OUT.enc"
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$OUT" -out "$ENCRYPTED" -pass pass:"$KEY"
rm -f "$OUT"
echo "Encrypted backup: $ENCRYPTED"

# Upload to backup bucket (FS driver or S3)
export S3_DRIVER="${S3_DRIVER:-fs}"
export LOCAL_S3_ROOT="${LOCAL_S3_ROOT:-$ROOT/.data/s3}"
export S3_BACKUP_BUCKET="$BUCKET"
pnpm exec tsx "$ROOT/scripts/upload-backup.ts" "$ENCRYPTED" "$BUCKET" "db/coop_launch_$STAMP.sql.enc"
echo "Backup uploaded to bucket=$BUCKET key=db/coop_launch_$STAMP.sql.enc"
