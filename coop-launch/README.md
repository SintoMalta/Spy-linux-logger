# CoopLaunch Malta

Evidence → Decision → Gate PWA for a 12-week cooperative founding programme in Malta.

This app lives under `coop-launch/` inside the Spy Linux Logger repository. Root logger files are untouched.

## Quick start

```bash
cd coop-launch
cp .env.example .env
docker compose up -d          # Postgres + MinIO
pnpm install
pnpm db:migrate:dev           # or: pnpm db:push
pnpm db:seed
pnpm dev
```

Open http://localhost:3000

Seed logins (password `ChangeMeNow!`):

- `nesli@cooplaunch.mt` — COORDINATOR
- `founder@cooplaunch.mt` — INDUSTRY_FOUNDER
- `admin@cooplaunch.mt` — ADMIN

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript `--noEmit` |
| `pnpm test` | Vitest unit + integration |
| `pnpm build` | Production build |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed 12-week programme |
| `pnpm test:e2e` | Playwright smoke |
| `./scripts/backup.sh` | Encrypted DB dump |
| `./scripts/restore-test.sh` | Restore smoke test |

## Docs

See [`docs/`](docs/) for product requirements, architecture, data model, security, deployment, implementation plan, and deployment readiness.

## Deploy

Production Compose + Caddy are documented. **Do not deploy to Hetzner** until `docs/DEPLOYMENT_READINESS.md` inputs are provided and explicitly approved.
