# CoopLaunch Malta — Security

## 1. Threat model (MVP)

| Threat | Mitigation |
|--------|------------|
| Credential stuffing / brute force | Argon2id; login rate limit by IP+email; lockout response 429 |
| Session theft | HTTP-only, Secure, SameSite=Lax cookies; hashed tokens; expiry; logout revokes |
| CSRF | SameSite cookies + origin checks on mutations; Next server actions patterns |
| Privilege escalation / IDOR | Server-side RBAC + resource visibility checks; never trust client role |
| XSS | React escaping; CSP headers; sanitize filenames |
| SQL injection | Prisma parameterised queries only |
| Confidential data leak (interviews, member prices) | Role-scoped queries; aggregation APIs strip CONFIDENTIAL_FINANCIAL / member prices |
| Upload abuse | Content-type/size limits; private bucket; signed URLs |
| Secret exposure | Env-only secrets; never log passwords/tokens; `.env` gitignored |
| Backup failure false confidence | restore-test.sh required before claiming backups work |
| Over-promising external copy | Seed templates fixed; UI copy checklist |

## 2. Authentication

- Password hashing: **Argon2id** (memory/time parameters in `src/server/auth/password.ts`).
- Session cookie name: `coop_session` (opaque token; store SHA-256 hash in DB).
- Default session TTL: 14 days (rolling optional refresh on activity).
- Password reset MVP: admin-assisted; self-serve token flow when SMTP configured.
- TOTP: schema stub only; not enforced until product asks.

### Login rate limiting

- Track `LoginAttempt` within a sliding window (e.g. 10 failures / 15 minutes / IP+email).
- Exceeded → HTTP 429; successful login clears recent failure weight for that pair.

## 3. RBAC matrix (summary)

| Capability | COORD | FOUNDER | MEMBER | ADVISER | READ_ONLY | ADMIN |
|------------|:-----:|:-------:|:------:|:-------:|:---------:|:-----:|
| Coordinator dashboard | ✓ | — | — | — | — | ✓ |
| Founder dashboard | ✓ | ✓ | — | — | — | ✓ |
| ACHIEVE tasks / DoD override | ✓ | — | — | — | — | ✓ |
| Gate override | ✓ | — | — | — | — | ✓ |
| CRM write | ✓ | limited | — | — | — | ✓ |
| Interview confidential financial | ✓ | — | — | — | — | ✓ |
| Problem Matrix (aggregated) | ✓ | scoped | scoped | scoped | scoped | ✓ |
| Supplier member prices | ✓ | — | own* | — | — | ✓ |
| Decisions create | ✓ | — | — | — | — | ✓ |
| Decisions mutate | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Document download | ACL | ACL | ACL | ACL | ACL | ✓ |
| User admin | — | — | — | — | — | ✓ |

\*Founding members may see only their own member-scoped offer fields when implemented; MVP focuses on coordinator + founder.

## 4. Audit & soft-delete

- Soft-delete important business records (`deletedAt`); hard delete reserved for sessions / ephemeral rows.
- `AuditLog` on: task status, gate satisfy/override, assumption changes, permission/role changes, decision create, registration evidence attach.
- GateOverride and Decision have no update/delete APIs.

## 5. Headers & transport

- Production: HTTPS via Caddy; HSTS.
- App sets: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, CSP baseline, `Permissions-Policy`.
- Cookies: `Secure` in production.

## 6. Object storage

- Private buckets; no public-read ACLs.
- Max upload size enforced (e. of 10 MiB MVP).
- Store SHA-256; virus scan out of scope for MVP (document as future).

## 7. Secure development practices

- Zod validation on all mutation inputs.
- Least-privilege DB user in production.
- No secrets in images; inject via env at runtime.
- Dependabot / manual `pnpm audit` before deploy.
