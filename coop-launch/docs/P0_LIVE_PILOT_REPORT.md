# P0 Live Pilot Readiness Report

**Branch:** `cursor/coop-launch-architecture-94f3`  
**PR:** https://github.com/SintoMalta/Spy-linux-logger/pull/1 (draft — do not merge)  
**Date:** 2026-10-05  
**Scope:** P0 only. P1 intentionally deferred.

## P0 checklist

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Correct 12-week programme + measurable gates | **COMPLETE** | `programme-data.ts` + seed; weeks 1–12 with DoD + metric gates; W4 &lt;3 problems → REDESIGN; W9 GO/CONDITIONAL_GO/NO_GO; W12 never auto-submits |
| 2 | Create/edit CRM contacts & organisations | **COMPLETE** | `/api/organisations`, `/api/people` CRUD + CRM UI create/edit + communications |
| 3 | Record/edit interviews | **COMPLETE** | Interview create form (draft/complete) + PATCH status/notes; construction template |
| 4 | Problem Matrix from real interviews | **COMPLETE** | Aggregates tags from COMPLETED interviews only; confidential finance stripped by role |
| 5 | Create founder action requests | **COMPLETE** | Coordinator dashboard form → `/api/founder-actions` |
| 6 | Founder can respond | **COMPLETE** | DONE/COMMENT/CALL_NESLI/DEFER (+ follow-up date on defer) |
| 7 | Create/edit suppliers + discussions/offers | **COMPLETE** | `/api/suppliers` + economic UI |
| 8 | Create/edit advice items | **COMPLETE** | Advice register statuses OPEN→CLOSED; governance UI |
| 9 | Registration checklist updatable | **COMPLETE** | PATCH notes/completed/evidence; upload auto-links evidenceDocumentId; mandatory blockers cap &lt;100% |
| 10 | Private document upload/download | **COMPLETE** | MIME allow-list, SHA-256, FS/S3 driver, signed/app download, RBAC, soft-delete, audit |
| 11 | Daily plan editable | **COMPLETE** | 20/100/60/40/20 blocks; end-of-day + proposals (no auto-mutate) |
| 12 | Secure authentication for real users | **COMPLETE** | Argon2id, HTTP-only cookies, rate limit, Origin CSRF on mutations, TRUST_PROXY-aware IP |
| 13 | Production must NOT use ChangeMeNow! | **COMPLETE** | Demo seed refuses in production; `scripts/bootstrap-admin.ts` + `seed-production-programme.ts` |
| 14 | HTTPS deployment configuration | **COMPLETE** | `docker-compose.prod.yml` + `docker/Caddyfile` (TLS, security headers) — prepared, not deployed |
| 15 | PostgreSQL production migration | **COMPLETE** | Prisma migration `20261005184657_acceptance_operational`; `pnpm db:migrate` |
| 16 | Backup create + restore | **COMPLETE** | Encrypted dump → backup bucket upload → download → isolated restore → integrity (`pnpm backup:restore-demo` OK: stages≥12) |

## Local quality (this environment)

| Check | Result |
|-------|--------|
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | 38 passed |
| `pnpm build` | pass (run with `NODE_ENV` unset) |
| Playwright smoke | run after this report push |
| `pnpm backup:restore-demo` | **RESTORE DEMO OK** |
| GitHub Actions | **PARTIAL** — workflow template at `coop-launch/ci/github-actions.yml` (repo-root `.github/` copy needed to enable Actions; boundary rule keeps it under `coop-launch/`). Do not claim CI green until Actions shows green. |

## Short deploy checklist (prepare only — awaiting approval)

1. Hetzner Ubuntu LTS VM + firewall 80/443 + SSH key deploy user (no root password)  
2. DNS A/AAAA → server  
3. Object Storage bucket + access keys (`S3_*`, `S3_BACKUP_BUCKET`)  
4. Set secrets: `SESSION_SECRET`, `BACKUP_ENCRYPTION_KEY`, `APP_URL=https://…`, `TRUST_PROXY=true`, `S3_DRIVER=s3`  
5. `docker compose -f docker-compose.prod.yml up -d` (or equivalent)  
6. `pnpm db:migrate` then `ALLOW_PROD_PROGRAMME_SEED=true pnpm db:seed:prod-programme`  
7. `ALLOW_BOOTSTRAP=true pnpm bootstrap:admin` × Nesli / Founder / Admin (strong passwords, never logged)  
8. Verify `/api/health`, login, doc upload, `pnpm backup`  
9. **Explicit written deploy approval**

## Asking for deploy inputs (stop here)

P0 items above are **COMPLETE**. Please provide:

1. **Hostname / IP** of the Hetzner server  
2. **Domain** name for HTTPS  
3. **DNS confirmation** that it will point at the server  
4. **S3 / Object Storage** endpoint, region, bucket(s), and permission to create access keys (or keys via secure channel)  
5. **Explicit approval** to deploy this draft to that server  

**No deploy will be performed until that approval.** PR stays draft; not merged.
