# DevOps Audit — School Management SaaS

Audit date: 2026-11-06 · Scope: repository `main` @ `f4c49e28` plus the uncommitted working tree.
No production systems were accessed (no Render credentials in this environment).

Status legend used throughout the docs:

| Label | Meaning |
|---|---|
| **Implemented** | Code/config is in the repository |
| **Tested locally** | Executed on the developer machine (Docker Desktop, Windows 11) |
| **Tested in GitHub Actions** | Executed by the real CI — *not yet: nothing has been pushed* |
| **Tested on Render** | Verified against the live service — *not yet: no access* |
| **Awaiting external configuration** | Needs a dashboard/secret change by the owner |

---

## 1. Existing architecture

| Layer | Finding |
|---|---|
| Backend | Laravel **12.54.1** (now 12.71.0 after security update), PHP `^8.2` in composer.json, **8.4** in Docker and CI |
| Frontend | React 19 + TypeScript 5.7 + Inertia.js 2, Vite 7, Tailwind 4, MUI 7, Wayfinder typed routes, PWA (`vite-plugin-pwa`) |
| Rendering | Single Laravel app serving Inertia pages (no separate SPA/API split) — **kept as is** |
| Database | PostgreSQL in production (`DATABASE_URL`), SQLite locally by default, SQLite in-memory for tests |
| Auth | Laravel Fortify (2FA), role middleware, dedicated parent/student/teacher login flows |
| Tenancy | Shared database, row-level `establishment_id` scoping in services/controllers (21 models carry it) |
| Realtime | Laravel Reverb + Echo — **not deployed** on Render (`BROADCAST_CONNECTION=null`); frontend skips Echo when no key is built in |
| AI features | Student-risk ML via a local Python process (`ml/predict.py`), academic assistant via Ollama — both **with graceful fallbacks** (rule-based) |
| Queues / scheduler | `QUEUE_CONNECTION=database` locally, **no `ShouldQueue` jobs exist**; `routes/console.php` schedules nothing |
| Files | Assignment submissions stored on the `public` disk → `storage/app/public` (**ephemeral on Render**) |
| Node | 22 (Docker, CI); local `node_modules` was corrupted (missing modules) — checks were run in clean containers |

## 2. Existing Render deployment configuration

* **No `render.yaml`** in the repository or its history — the service was configured by hand in the dashboard.
  Its exact settings (region, plan, branch, auto-deploy, health check path, env vars) are unknown.
* Commit `f4c49e28` (2026-08-13, *"Prepare PHP 8.4 Docker deployment for Render"*) introduced the
  `Dockerfile`, `docker/entrypoint.sh`, `docker/apache-vhost.conf` and `DATABASE_URL` support. This is the last commit.
* The original entrypoint: rewrote Apache ports with `sed`, ran `chown -R` as root on every boot,
  **ran `php artisan migrate --force` on every boot by default** (`RUN_MIGRATIONS=true` baked into the image),
  then cached config/routes/views.
* Logs: `LOG_CHANNEL=stderr` → visible in the Render dashboard. None are in the repository.

## 3. Potential failure points (found during the audit)

| # | Severity | Finding | Status |
|---|---|---|---|
| F1 | **Critical** | **Render Free PostgreSQL expires 30 days after creation**, then is deleted after a 14-day grace period. The Docker setup dates from 2026-08-13; if the DB was created then, it expired ≈ 2026-09-12 and became eligible for deletion ≈ 2026-09-26. *Unverified* — see [render-outage-investigation.md](render-outage-investigation.md) | Awaiting owner check |
| F2 | **Critical** | **72 security advisories in Composer dependencies**, incl. CRITICAL in `laravel/framework` 12.54.1 and `phpoffice/phpspreadsheet` 1.30.3, HIGH in guzzle, league/commonmark, maatwebsite/excel, symfony/* | **Fixed**: patch/minor updates only — `composer audit`: 0 advisories; Trivy: 0 fixable HIGH/CRITICAL |
| F3 | High | 4 production dependencies used `"*"` constraints — an innocent `composer update` tried to jump `maatwebsite/excel` 3→4 and `phpspreadsheet` 1→5 | **Fixed**: caret constraints |
| F4 | High | No trusted-proxy configuration. Render terminates TLS; without it Laravel sees `http://` → mixed-content asset URLs, non-`Secure` cookies, wrong redirect scheme | **Fixed**: `trustProxies('*')`, `APP_FORCE_HTTPS`; verified with a simulated proxy |
| F5 | High | No `php.ini` in the image → PHP defaults: `upload_max_filesize=2M` while the app accepts 10 MB submissions; no production error settings | **Fixed**: `php.ini-production` + `docker/php/production.ini` |
| F6 | High | Apache prefork default `MaxRequestWorkers 150` with mod_php on a 512 MB instance → OOM-kill under modest concurrency | **Fixed**: bounded via `APACHE_MAX_REQUEST_WORKERS` (8–10) |
| F7 | High | **Uploaded files on the ephemeral filesystem**: every deploy/restart/spin-down loses all assignment submissions | **Not fixed — needs a decision** (S3-compatible storage, see §5) |
| F8 | High | Test suite **could not run at all**: two test files declared the same global helper (`Cannot redeclare createUserWithRole()`) — CI could never have been green | **Fixed** (helpers moved to `tests/Pest.php`) |
| F9 | Medium | 6 pre-existing failing tests on SQLite / 4 on PostgreSQL: tests inserted `grades.establishment_id/created_by/updated_by` (no migration creates them) and compared JSON numbers as strict floats; assignment update returned a validation redirect instead of 403 for non-owners; SQLite notification scoping compared INTEGER to TEXT | **Fixed**: tests corrected, ownership authorized before validation (+ positive test), SQLite cast. 154/154 on SQLite; PostgreSQL green except F10 |
| F10 | Medium | **Uncommitted** change in `app/Models/Attendance.php` (`student()` → `StudentProfile`) makes the attendance-history page return **HTTP 500 on PostgreSQL** (`select id, name from student_profiles`); SQLite hides it | **Reported**; your file left untouched |
| F11 | Medium | 21 of 40 migrations start with `if (Schema::hasTable(...)) return;` → migrations are not a reliable description of the production schema; **a restore must use a dump, never `migrate:fresh`** | Documented |
| F12 | Medium | Migrations run at every boot with no backup step | Kept opt-in (`RUN_MIGRATIONS`), forward-only, destructive commands blocked by `DB::prohibitDestructiveCommands()`; backup procedure documented |
| F13 | Medium | Old workflows: `contents: write`, `npm install` (ignores lockfile), unpinned actions, PHP 8.5 matrix not used in prod, no PostgreSQL, no deploy gating | **Replaced** |
| F14 | Low | Lint debt: Pint 58 files, ESLint 50 errors (2 real React Compiler issues), Prettier 101 files | **Fixed** (mechanical + 2 small behaviour-preserving edits) |
| F15 | Low | `.gitignore` entry for `ml/.venv` was corrupted (`/ml/.venv/²`) — a whole Python virtualenv was committed in history (`.git` = 179 MB) | Ignore fixed; history not rewritten |
| F16 | Low | Working tree deletes `public/images/landing-school-hero.png`, still used by `resources/js/pages/welcome.tsx:243` | Reported, not touched |
| F17 | Low | Stray files at the root: `getLoadedConfigurationFiles())`, `~$pport_PFE_...docx` (Word lock file) | Excluded from the image; delete at your convenience |
| F18 | Info | Container ran as root; config cached at boot; no `HEALTHCHECK`; no readiness endpoint | **Fixed** |

## 4. Production-readiness assessment

| Area | Before | After (this work) |
|---|---|---|
| Build reproducibility | Mostly (lockfiles), floating base tags | Pinned base images, lockfile-only installs, Dependabot |
| Security of dependencies | 72 advisories, 2 critical | 0 advisories, Trivy gate in CI |
| Runtime hardening | root, no php.ini, default Apache | non-root (UID 33), hardened PHP/Apache, security headers, HSTS behind TLS |
| Health | `/up` only | `/up` (liveness) + `/health/ready` (DB readiness, no leaks, no session) + `app:health-check` |
| CI | Broken test suite, non-gating | 4 parallel gates (backend on PostgreSQL, frontend, Docker, security) |
| CD | Render auto-deploy (presumably) | Deploy only after CI, specific SHA, concurrency-locked, smoke-tested |
| Data durability | Free DB (expires), no backups | Backup / verify / restore scripts + daily encrypted off-site backup workflow — **provider decision pending** |
| File durability | Ephemeral disk | **Still ephemeral — decision pending** |
| Observability | stderr logs | + readiness, release identifier, smoke tests; uptime/Sentry documented, not activated |

Verdict: **ready for a controlled redeploy** once a persistent database exists, with two open risks owned
by the product owner: uploaded files (F7) and the uncommitted attendance change (F10).

## 5. Recommended infrastructure improvements (not implemented — need approval or cost)

1. **Persistent PostgreSQL** — Render `basic-256mb` (~$6/mo + $0.30/GB, PITR 3 days on Hobby) or Neon Free ($0). See [database-backups.md](database-backups.md#choosing-a-provider).
2. **Object storage for uploads** — Cloudflare R2 (10 GB free) or any S3-compatible bucket, private, served through the existing authorised download controller. Requires `league/flysystem-aws-s3-v3` and a small change to `AssignmentSubmissionService` / student `attachment_url` (signed temporary URLs).
3. **Render Starter plan** ($7/mo) if cold starts are unacceptable for users.
4. **Error tracking** (Sentry free tier) and **uptime monitoring** (UptimeRobot free) — see [monitoring.md](monitoring.md).
5. **Image-backed deploys via GHCR** once the team grows (deploy exactly the scanned artifact) — see [render-deployment.md](render-deployment.md#git-backed-vs-image-backed).
6. Fix the schema drift (F9/F11) with a reconciling migration generated from the real production schema.

## 6. Implementation roadmap

| Phase | Work | State |
|---|---|---|
| 0 | Confirm DB status in Render dashboard; export it if still reachable | **Owner** — [checklist](render-outage-investigation.md#5-owner-checklist-render-dashboard) |
| 1 | Merge this branch (CI green; keep the F10 change out until fixed) | Owner decision |
| 2 | Create persistent DB, restore, set `DATABASE_URL`, turn auto-deploy **off**, add deploy hook secret | Owner (≈30 min) |
| 3 | First CI-driven deploy + smoke test | Automated |
| 4 | Object storage for uploads | Needs approval |
| 5 | Sentry + UptimeRobot | Optional, free |
