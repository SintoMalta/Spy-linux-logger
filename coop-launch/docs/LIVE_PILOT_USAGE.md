# CoopLaunch Malta — LIVE PILOT usage

## Live URL

- **Intended:** https://coop.mihai.com.mt
- **Status:** App stack is live on the Hetzner host behind nginx. **Public DNS A for `coop.mihai.com.mt` is currently NXDOMAIN** (not published at hostingww). Until an A record points to `116.203.82.108`, browsers and Let’s Encrypt will not resolve the name.
- **On-server check (works today):** `curl -sk --resolve coop.mihai.com.mt:443:127.0.0.1 https://coop.mihai.com.mt/api/health` → `{"ok":true,"db":true}`
- **TLS now:** interim self-signed cert under `/etc/nginx/ssl/coop.mihai.com.mt.*`. After DNS exists, root can run `/opt/coop-launch/obtain-letsencrypt.sh`.

## Credentials (passwords not in this doc)

- Bootstrap file on server (root-only, mode 600): **`/opt/coop-launch/credentials.bootstrap`**
- Contains Nesli, Industry Founder, Admin (and Adviser) emails + strong passwords, DB/S3/session/backup keys.
- Demo password `ChangeMeNow!` is **not** used; login form no longer prefills it.
- Operators: `sudo cat /opt/coop-launch/credentials.bootstrap` (then rotate after first pilot week).

### Accounts

| Role | Email | Landing after login |
|------|-------|---------------------|
| Coordinator (Nesli) | `nesli@cooplaunch.mt` | `/dashboard` |
| Industry Founder | `founder@cooplaunch.mt` | `/founder` |
| Admin | `admin@cooplaunch.mt` | `/dashboard` |

## How Nesli (Coordinator) uses it

1. Open https://coop.mihai.com.mt (once DNS is live) and sign in with Nesli credentials from the bootstrap file.
2. Use **Dashboard** for daily plan / overview; **Programme** for week stages, tasks, and gates; **CRM** for organisations/people; **Interviews** for discovery; **Economic** / **Governance** / **Registration** as the programme progresses.
3. Assign founder action requests; advance gates only when evidence criteria are met (or use audited override as Admin/Coordinator where allowed).
4. Do not share the bootstrap file; hand Founder their password out-of-band.

## How Industry Founder uses it

1. Sign in with `founder@cooplaunch.mt` and the Founder password from the bootstrap file.
2. Land on **Needs from you** (`/founder`) — complete open action requests from Nesli.
3. Founder does not get full programme-admin CRM tooling; Coordinator drives programme ops.

## Smoke results (2026-10-06)

| Check | Result |
|-------|--------|
| `GET /api/health` (via nginx SNI + app `:3010`) | `{"ok":true,"db":true}` |
| Nesli login | 200 → `/dashboard` |
| Founder login | 200 → `/founder` |
| Admin login | 200 → `/dashboard` |
| `ChangeMeNow!` rejected | 401 |
| Unauthenticated gate advance | blocked |
| Home shows “CoopLaunch Malta” | yes |
| calc.mihai.com.mt | still 200; mihai-* containers untouched |
| Encrypted backup + restore test | OK (`User` count 4 after restore) |

## Ops layout on server

- App tree: `/opt/coop-launch/app` (Linux user `cooplaunch` + docker group)
- Compose: `docker-compose.hetzner.yml` — app on `127.0.0.1:3010`, dedicated Postgres + adobe/s3mock (MinIO Hub pull denied on this host)
- Nginx site: `/etc/nginx/sites-available/coop.mihai.com.mt` (backups under `/root/nginx-backups/`)
- Credentials: `/opt/coop-launch/credentials.bootstrap`
- Backups: `/opt/coop-launch/backups/*.sql.enc`
- LE helper: `/opt/coop-launch/obtain-letsencrypt.sh`

## Blockers / follow-ups

1. **DNS:** Create A record `coop.mihai.com.mt` → `116.203.82.108` at hostingww, then run `/opt/coop-launch/obtain-letsencrypt.sh`.
2. **Object storage:** Pilot uses `adobe/s3mock` (no upload UI wired in MVP yet). Prefer Hetzner Object Storage keys when available; MinIO image pull was denied from Docker Hub on this host.
3. **Rotate** root password if it was exposed in earlier chat; rotate bootstrap passwords after first week.
4. CRM “create contact” / document upload UIs are not yet implemented in MVP — CRM is read/list seeded orgs; documents list is empty until upload API exists.

## Git note

Deploy used worktree `/workspace/wt-coop-launch` on branch `cursor/coop-launch-architecture-94f3`. Agent VM could not push to GitHub (DNS to github.com failed); commits exist locally ahead of origin. No PR merge. No secrets committed.
