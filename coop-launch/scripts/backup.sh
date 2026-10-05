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
mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

# pg_dump does not accept Prisma's ?schema= query param
PG_URL="${DATABASE_URL%%\?*}"

OUT="$BACKUP_DIR/coop_launch_$STAMP.sql"
echo "Dumping database to $OUT"
pg_dump "$PG_URL" --no-owner --format=plain > "$OUT"

if [[ -n "$KEY" ]]; then
  ENCRYPTED="$OUT.enc"
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "$OUT" -out "$ENCRYPTED" -pass pass:"$KEY"
  rm -f "$OUT"
  echo "Encrypted backup written to $ENCRYPTED"
else
  echo "WARNING: BACKUP_ENCRYPTION_KEY unset; left plaintext dump at $OUT" >&2
fi
