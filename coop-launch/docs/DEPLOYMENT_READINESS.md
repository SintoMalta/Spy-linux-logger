# Deployment Readiness Report

**Status:** Application MVP implemented under `coop-launch/`. **Not deployed.** No Hetzner provisioning was performed.

## What is ready in-repo

- Next.js App Router app with auth, RBAC, programme/gates, CRM, interviews, economic, governance, registration
- Docker Compose (local Postgres + MinIO; prod overlay with Caddy)
- `scripts/backup.sh` and `scripts/restore-test.sh`
- Security headers + `/api/health`
- Playwright smoke tests under `e2e/`
- Docs in `coop-launch/docs/`

## What you must provide before deploy

| Item | Why needed | Status |
|------|------------|--------|
| **Domain name** | Caddy TLS + `APP_URL` | Awaiting user |
| **Server identity** | Hetzner Ubuntu LTS host (IP/hostname), SSH access for deploy user | Awaiting user |
| **Object storage** | Hetzner Object Storage (or other S3) endpoint, bucket, access key, secret | Awaiting user |
| **SMTP** (optional) | Self-serve password reset emails | Optional |
| **Explicit approve** | Written confirmation to deploy to the named server | Awaiting user |

Also confirm offline: backup encryption key storage location, and that seed passwords will be rotated immediately after first login.

## Explicit non-actions

- No DNS changes
- No Hetzner VM creation
- No production secrets committed
- No live deploy performed by the agent

## Next step after you reply

Provide the table items above (or mark SMTP as “skip”). After explicit approval, an operator can follow `docs/DEPLOYMENT.md` to bring up `docker-compose.prod.yml`.
