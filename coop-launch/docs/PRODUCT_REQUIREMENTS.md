# CoopLaunch Malta — Product Requirements

## 1. Purpose

CoopLaunch Malta is a Progressive Web App for coordinating a **12-week cooperative founding programme** in Malta. It is not a generic task list: it enforces an **Evidence → Decision → Gate → Next Stage** workflow so progression is evidence-backed, auditable, and role-safe.

Primary operators:

| Role | Person (seed) | Job |
|------|---------------|-----|
| COORDINATOR | Nesli | Runs the programme, daily plans, gates, CRM, finance, governance |
| INDUSTRY_FOUNDER | Industry Founder | Completes “Needs from you” actions; sees scoped progress |
| FOUNDING_MEMBER | (optional later) | Limited visibility to member-relevant items |
| ADVISER | Seeded adviser | Advice register contribution; read scoped packs |
| READ_ONLY | — | View-only |
| ADMIN | — | User/session housekeeping |

## 2. Objectives

1. Guide founding of a Maltese cooperative through twelve weekly stages with Definition of Done (DoD) and stage gates.
2. Capture market validation (organisations, people, interviews) and aggregate a Problem Matrix without leaking confidential financial answers.
3. Support economic validation (suppliers, labelled assumptions, member value statements) without exposing cross-member confidential prices.
4. Maintain governance artefacts: advice, meetings, immutable decisions, risks, versioned documents.
5. Track registration readiness with **mandatory blockers** that prevent 100% until evidence is attached.
6. Provide dual dashboards: rich coordinator view and a simple founder “Needs from you” view.
7. Run locally with Docker Compose (Postgres + MinIO) and be deployable to Hetzner Ubuntu LTS when explicitly approved.

## 3. Core workflow (non-negotiable)

```
Evidence → Decision → Gate evaluation → Next stage
                ↘ incomplete → Block progression
```

- A task may move to **ACHIEVED** only when all DoD criteria are met, or an authorised user records an audited override with reason.
- Stage progression requires gate criteria met or an audited `GateOverride`.
- Registration readiness cannot reach 100% while any mandatory requirement lacks evidence.
- UI must never be the only control: all rules are enforced in `src/server/` domain services.

## 4. Modules & acceptance criteria

### 4.1 Identity & access

- Custom session auth: HTTP-only secure cookies, Argon2id password hashes, login rate limiting.
- Server-side RBAC for all six roles; IDOR checks on resource visibility.
- Soft-delete + `AuditLog` for critical status/gate/assumption/permission/decision changes.

**AC:** Unauthenticated users cannot access app routes; wrong role cannot ACHIEVE tasks or override gates; rate limit returns 429 after threshold.

### 4.2 Programme execution

- Stages (weeks 1–12), Tasks, checklist items, DoD criteria, task dependencies.
- DailyPlan (≈4h coordinator focus) and TimeEntry.
- Gates with criterion types: boolean | numeric_min | required_document | required_review | required_external_answer | manual_approval.
- GateReview and GateOverride (immutable audit fields).
- FounderActionRequest with actions: DONE | COMMENT | CALL_NESLI | DEFER.
- Seeded full 12-week programme from this product spec (see §6).

**AC:** ACHIEVED blocked without DoD; gate block/override audited; both dashboards render seeded data.

### 4.3 Market validation

- Organisation + Person CRM; communication log; follow-ups.
- Organisation/Person status includes **DO_NOT_PURSUE** (correct spelling).
- Interviews from templates; Problem Matrix aggregation by tag (no confidential per-respondent financial leakage to unauthorised roles).
- FounderAssessment: positive indicators + red-flag *prompts* (careful language), evidence/notes.

**AC:** Interview answers feed matrix; founder role cannot see confidential financial interview fields.

### 4.4 Economic validation

- Supplier, SupplierOffer, comparison helpers.
- FinancialAssumption labelled VERIFIED | ESTIMATE | ASSUMPTION; scenarios.
- MemberValueStatement calculations.
- No cross-member confidential price exposure.

**AC:** Assumption labels always visible; member-specific prices only to authorised roles.

### 4.5 Governance

- AdviceItem register (categories/statuses).
- Meetings; Decisions immutable after create.
- Risks (probability, impact, rating, mitigation, owner, trigger, status).
- Documents in S3-compatible storage (MinIO local); metadata, hash, version, polymorphic links.
- Seeded templates matching §31–32 copy exactly; no over-promising language.

**AC:** Decision update API rejected; document download requires permission; templates match seed text.

### 4.6 Registration

- RegistrationRequirement checklist; readiness %; mandatory blockers.
- Evidence attachments linked to requirements.

**AC:** Missing mandatory evidence → readiness < 100% and blocked flag true.

### 4.7 Cross-cutting UX

- Mobile-responsive layouts; large touch targets.
- PWA manifest + icons; offline shell with banner; cached today plan + draft note persistence (best-effort).
- In-app notifications first; push optional/best-effort.
- Search and weekly report scoped by role.

## 5. Non-goals (MVP)

- Kubernetes, Redis, microservices.
- Auth SaaS / social login.
- Guaranteed iOS push.
- Live Hetzner deploy without explicit user approval.
- Editing Spy Linux Logger files at repo root.

## 6. Twelve-week programme (seed outline)

| Week | Stage theme | Example gate focus |
|------|-------------|--------------------|
| 1 | Kick-off & framing | Founders aligned; charter draft started |
| 2 | Stakeholder map | CRM seeded; interview plan approved |
| 3 | Problem discovery | ≥N interviews logged; tags populated |
| 4 | Problem Matrix | Matrix reviewed; top problems ranked |
| 5 | Founder fit | Assessment drafted (careful language) |
| 6 | Solution options | Options documented with evidence |
| 7 | Supplier scan | ≥1 comparable offers |
| 8 | Economics | Assumptions labelled; scenario A/B |
| 9 | Member value | Draft MemberValueStatement |
| 10 | Governance pack | Advice + risks + decisions current |
| 11 | Registration pack | Checklist open; blockers listed |
| 12 | Go / no-go | Gate review; registration readiness |

Exact task titles, DoD items, and gate criteria are seeded in `prisma/seed.ts` and must remain coherent with this outline.

## 7. Template copy requirements (§31–32)

Seeded communication templates must:

- Use client-facing language that does **not** over-promise outcomes, funding, or registration success.
- Prefer factual, invitation-style wording (“we are exploring…”, “provisional”, “subject to evidence”).
- Match the exact strings shipped in seed data (do not “improve” marketing tone in UI).

## 8. Quality bar

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- Logical commits; never commit `.env`, secrets, or DB dumps.
- Prefer working MVP completeness over visual polish.
- No deployment to Hetzner until Deployment Readiness Report items are provided and explicitly approved.
