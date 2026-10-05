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
TEST_DB="${RESTORE_TEST_DB:-coop_launch_restore_test}"

LATEST="$(ls -1t "$BACKUP_DIR"/coop_launch_*.sql.enc "$BACKUP_DIR"/coop_launch_*.sql 2>/dev/null | head -1 || true)"
if [[ -z "$LATEST" ]]; then
  echo "No backup found in $BACKUP_DIR — run scripts/backup.sh first" >&2
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

if [[ "$LATEST" == *.enc ]]; then
  if [[ -z "$KEY" ]]; then
    echo "BACKUP_ENCRYPTION_KEY required to decrypt $LATEST" >&2
    exit 1
  fi
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$LATEST" -out "$TMP" -pass pass:"$KEY"
else
  cp "$LATEST" "$TMP"
fi

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

echo "Recreating test database $TEST_DB"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TEST_DB};"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TEST_DB};"
psql "$TEST_URL" -v ON_ERROR_STOP=1 -f "$TMP" >/dev/null

COUNT="$(psql "$TEST_URL" -tAc 'SELECT COUNT(*) FROM "User";')"
echo "Restore test OK — User count=$COUNT"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TEST_DB};"
