#!/usr/bin/env bash
# Demonstrate: create encrypted backup → upload to backup bucket → download → restore isolated DB → integrity check
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck disable=SC1091
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

export S3_DRIVER="${S3_DRIVER:-fs}"
export LOCAL_S3_ROOT="${LOCAL_S3_ROOT:-$ROOT/.data/s3}"
export BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
export BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-dev-backup-key-change-in-prod}"
export S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-coop-launch-backups}"
TEST_DB="${RESTORE_TEST_DB:-coop_launch_restore_demo}"

echo "== 1) Create + encrypt + upload =="
"$ROOT/scripts/backup.sh"

LATEST_KEY="$(ls -1t "$LOCAL_S3_ROOT/$S3_BACKUP_BUCKET/db/"*.sql.enc 2>/dev/null | head -1 || true)"
if [[ -z "$LATEST_KEY" ]]; then
  echo "No uploaded backup found under $LOCAL_S3_ROOT/$S3_BACKUP_BUCKET/db" >&2
  exit 4
fi
echo "Found uploaded object: $LATEST_KEY"

echo "== 2) Download (copy from backup bucket) =="
TMP="$(mktemp)"
DECRYPTED="$(mktemp)"
trap 'rm -f "$TMP" "$DECRYPTED"' EXIT
cp "$LATEST_KEY" "$TMP"

echo "== 3) Decrypt =="
openssl enc -d -aes-256-cbc -pbkdf2 -in "$TMP" -out "$DECRYPTED" -pass pass:"$BACKUP_ENCRYPTION_KEY"

echo "== 4) Restore into isolated DB =="
PG_URL="${DATABASE_URL%%\?*}"
ADMIN_URL="$(python3 - <<PY
from urllib.parse import urlparse, urlunparse
import os
p=urlparse(os.environ['DATABASE_URL'].split('?')[0])
print(urlunparse((p.scheme,p.netloc,'/postgres','','','')))
PY
)"
TEST_URL="$(python3 - <<PY
from urllib.parse import urlparse, urlunparse
import os
p=urlparse(os.environ['DATABASE_URL'].split('?')[0])
print(urlunparse((p.scheme,p.netloc,'/$TEST_DB','','','')))
PY
)"

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TEST_DB};"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TEST_DB};"
psql "$TEST_URL" -v ON_ERROR_STOP=1 -f "$DECRYPTED" >/dev/null

echo "== 5) Integrity checks =="
USERS="$(psql "$TEST_URL" -tAc 'SELECT COUNT(*) FROM "User";')"
STAGES="$(psql "$TEST_URL" -tAc 'SELECT COUNT(*) FROM "Stage";')"
echo "User count=$USERS Stage count=$STAGES"
if [[ "$STAGES" -lt 12 ]]; then
  echo "Integrity failed: expected ≥12 stages" >&2
  exit 5
fi

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TEST_DB};"
echo "RESTORE DEMO OK"
