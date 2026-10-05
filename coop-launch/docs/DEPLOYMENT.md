# CoopLaunch Malta — Deployment

## 1. Local development

Prerequisites: Node 22+, pnpm 9+, Docker (for Postgres + MinIO).

```bash
cd coop-launch
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Services:

| Service | Port | Purpose |
|---------|------|---------|
| Next.js | 3000 | App |
| Postgres | 5432 | Database |
| MinIO API | 9000 | S3-compatible storage |
| MinIO Console | 9001 | Local bucket UI |

## 2. Production topology (documented — not auto-deployed)

```
Internet → Caddy (TLS) → app container → Postgres (private network)
                                      ↘ Hetzner Object Storage
Cron/systemd → scripts/backup.sh → encrypted dump → off-box storage
```

Files:

- `docker-compose.prod.yml` — app, postgres, caddy
- `docker/Caddyfile` — reverse proxy + security headers
- `docker/Dockerfile` — multi-stage Next.js standalone build

**Do not deploy to Hetzner until** the Deployment Readiness Report items are provided and the user explicitly approves.

## 2b. Live pilot production bootstrap (no demo passwords)

```bash
# On server after migrate:
ALLOW_PROD_PROGRAMME_SEED=true pnpm db:seed:prod-programme
# Interactive strong passwords — never commit/log:
ALLOW_BOOTSTRAP=true pnpm bootstrap:admin   # Nesli COORDINATOR, Founder, Admin (run per user)
```

Demo seed (`pnpm db:seed`) **refuses** when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.
Production data should be: users + 12-week programme/gates/templates/registration checklist only.

Set `S3_DRIVER=s3` with Hetzner Object Storage credentials. Set `TRUST_PROXY=true` behind Caddy.
Set `APP_URL=https://your.domain` and optional `ALLOWED_ORIGINS`.

## 2c. Backup (encrypted, off app volume)

```bash
pnpm backup                 # encrypt + upload to S3_BACKUP_BUCKET
pnpm backup:restore-demo    # download/decrypt/restore isolated DB + integrity check
```

Cron example (document only): `0 2 * * * cd /opt/coop-launch && ./scripts/backup.sh`

## 3. Environment variables

See `.env.example`. Never commit real `.env` or dumps.

Critical:

- `DATABASE_URL`
- `SESSION_SECRET` (≥32 random bytes)
- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `APP_URL` / `NEXT_PUBLIC_APP_URL`
- Optional SMTP for self-serve reset

## 4. Backups & restore

```bash
./scripts/backup.sh           # encrypted pg_dump to BACKUP_DIR
./scripts/restore-test.sh     # restore into ephemeral DB and smoke-query
```

Documented restore procedure for operators:

1. Stop app writes (scale app to 0 or maintenance mode).
2. Decrypt backup with the backup key (stored offline / secrets manager — not in git).
3. `pg_restore` / `psql` into target database.
4. Verify row counts + `/api/health`.
5. Restart app; spot-check login + latest AuditLog.

Claim “backups work” only after `restore-test.sh` exits 0.

## 5. Hetzner checklist (pre-approval)

- [ ] Ubuntu LTS VM sized for app + Postgres
- [ ] Firewall: 80/443 only public; SSH key-only; no root password login
- [ ] Dedicated deploy user
- [ ] Domain DNS A/AAAA → server
- [ ] Object storage bucket + keys created
- [ ] SMTP (optional) credentials
- [ ] Backup target + encryption key
- [ ] Explicit written approval to deploy

## 6. Health

`GET /api/health` → `{ ok: true, db: true }` when healthy.

## 7. Rollback

Keep previous Compose image tag; on failure redeploy previous tag and restore DB from last known-good backup if migrations are incompatible.
