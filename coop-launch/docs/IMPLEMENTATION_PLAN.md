# CoopLaunch Malta — Implementation Plan

## Principles

- Work only under `coop-launch/`; never modify Spy Linux Logger root files.
- Follow Evidence → Decision → Gate → Next Stage in product and code.
- Do not start milestone N+1 while milestone N critical tests fail.
- Prefer working MVP completeness over polish.
- No Hetzner deploy without Deployment Readiness Report + explicit approval.

## Milestone 0 — Docs

**Deliverables:** PRODUCT_REQUIREMENTS, ARCHITECTURE, DATA_MODEL, SECURITY, DEPLOYMENT, IMPLEMENTATION_PLAN.

**Exit:** Docs coherent and sufficient for production build.

## Milestone 1 — Foundation

**Scope:** Next.js App Router, TS strict, Tailwind, shadcn/ui, pnpm; Prisma + Postgres; docker-compose (Postgres + MinIO); session auth + Argon2id + rate limit; RBAC; app layout; PWA shell; AuditLog; soft-delete; README; unit/auth tests.

**Critical tests:** password hash verify; session create/revoke; rate limit; requireRole deny.

**Exit:** `pnpm test` auth suite green; offline shell serves; `pnpm lint` / `typecheck` clean for scaffold.

## Milestone 2 — Programme execution

**Scope:** Stages, Tasks, DoD, dependencies, DailyPlan, TimeEntry; Gate engine + override audit; ACHIEVED blocked without DoD; coordinator + founder dashboards; 12-week seed; FounderActionRequest actions; integration tests.

**Critical tests:** markAchieved without DoD fails; with DoD succeeds; gate block; gate override audited.

**Exit:** Seed loads; dashboards render; critical tests green.

## Milestone 3 — Market validation

**Scope:** Organisation/Person CRM (DO_NOT_PURSUE); Interviews; Problem Matrix aggregation; FounderAssessment; fictional contact seed.

**Critical tests:** matrix aggregation; confidential financial hidden from founder role.

**Exit:** CRM + interview flows usable by coordinator.

## Milestone 4 — Economic

**Scope:** Supplier/offers/comparison; FinancialAssumption labels; scenarios; MemberValueStatement; no cross-member price leak.

**Critical tests:** assumption label required; price visibility RBAC.

**Exit:** Economic pages + calculations available to coordinator.

## Milestone 5 — Governance

**Scope:** Advice register; Meetings; immutable Decisions; Risks; Documents (MinIO); §31–32 templates seeded exactly.

**Critical tests:** decision update rejected; template body matches seed constants.

**Exit:** Governance pack usable; document upload/download with ACL.

## Milestone 6 — Registration

**Scope:** Checklist; readiness %; mandatory blockers; evidence attachments.

**Critical tests:** missing mandatory → blocked & &lt;100%; all mandatory satisfied → can reach 100%.

**Exit:** Registration readiness page accurate.

## Milestone 7 — Hardening

**Scope:** backup.sh + restore-test.sh; restore procedure in DEPLOYMENT; security headers; health endpoint; Playwright smoke; DEPLOYMENT_READINESS.md (domain, server, S3, SMTP, explicit approve). **Do not deploy.**

**Critical tests:** health ok; Playwright smoke passes in CI/local; lint/typecheck/test/build all green.

**Exit:** Deployment Readiness Report written; quality bar met.

## Definition of Done (project)

- [ ] M0–M7 delivered in PR
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
- [ ] Dual dashboards mobile-responsive
- [ ] No secrets committed
- [ ] Ready for user-provided deploy inputs — not deployed
