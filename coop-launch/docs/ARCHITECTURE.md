# CoopLaunch Malta — Architecture

## 1. Overview

CoopLaunch is a single Next.js App Router application under `coop-launch/`. Domain rules live in `src/server/` so UI, Route Handlers, and a future native shell share the same enforcement.

```
Browser PWA → (Caddy HTTPS in prod) → Next.js → RBAC → Domain Services → PostgreSQL / S3
```

## 2. Stack

| Layer | Choice |
|-------|--------|
| App | Next.js App Router, React, TypeScript `strict` |
| Package manager | pnpm |
| UI | Tailwind CSS + shadcn/ui (Radix) |
| ORM | Prisma + PostgreSQL |
| Auth | Custom sessions (HTTP-only cookies) + Argon2id |
| Files | S3-compatible (MinIO local; Hetzner Object Storage prod) |
| Proxy | Caddy (prod Compose) |
| Tests | Vitest + Playwright |
| Deploy | Docker Compose on Hetzner Ubuntu LTS |

## 3. Repository layout

```
coop-launch/
  docs/
  src/
    app/              # App Router pages & API routes
    components/       # UI (shadcn + domain)
    lib/              # shared utils, prisma client, env
    server/           # domain services (auth, gates, dod, rbac, …)
  prisma/             # schema, migrations, seed
  docker/             # Dockerfile, Caddyfile
  scripts/            # backup.sh, restore-test.sh
  e2e/                # Playwright
  public/             # PWA manifest & icons
  docker-compose.yml
  docker-compose.prod.yml
```

Root Spy Linux Logger files remain untouched.

## 4. Workflow engines

### 4.1 Evidence → Decision → Gate

1. Users attach evidence (notes, documents, interview answers, checklist ticks).
2. Coordinator records a Decision (immutable) when warranted.
3. Gate service evaluates `GateCriterion` rows for the current stage.
4. If all criteria pass → stage may advance.
5. If not → progression blocked unless `GateOverride` with reason + authoriser is written (audited, immutable).

### 4.2 Definition of Done

- Each Task has `DefinitionOfDoneCriterion` rows.
- `taskService.markAchieved` verifies every criterion satisfied (or audited DoD override).
- Dependencies: blocked until prerequisite tasks are ACHIEVED (or waived via audited path).

### 4.3 Registration readiness

- `registrationService.computeReadiness` returns percent + list of mandatory blockers.
- Mandatory missing evidence ⇒ percent capped below 100 and `blocked: true`.

## 5. AuthN / AuthZ boundaries

- Sessions stored in DB; cookie holds opaque session token (hashed at rest).
- Middleware / `requireSession` on every protected route and server action.
- `requireRole` / `assertCan` checks role + resource visibility before queries return data.
- Aggregation APIs (Problem Matrix, member value) strip confidential fields for non-authorised roles.

## 6. PWA / offline

- `manifest.webmanifest` + icons under `public/`.
- Service worker (or Next PWA shell) caches app shell and today’s daily plan payload.
- Offline banner when `navigator.onLine` is false; draft notes persist to `localStorage`.
- Push notifications are best-effort and not required for MVP acceptance.

## 7. Data & files

- PostgreSQL is source of truth; Prisma migrations only.
- Soft-delete via `deletedAt` on important business tables; queries default to `deletedAt: null`.
- Uploads go to object storage; DB stores metadata, content hash, version, ACL flags.
- Signed temporary URLs for downloads.

## 8. Observability & ops

- `/api/health` — liveness + DB ping.
- Security headers via Next config + Caddy.
- Daily encrypted DB backup script; restore-test script must pass before claiming backup works.
- AuditLog append-only for critical mutations.

## 9. Testing strategy

| Layer | Tool | Focus |
|-------|------|-------|
| Unit | Vitest | RBAC helpers, DoD/gate pure functions, readiness math |
| Integration | Vitest + Prisma | Gate engine, DoD ACHIEVED rules, auth rate limit |
| E2E | Playwright | Login, dashboards, key happy paths |

Do not advance past a milestone while its critical tests fail.
