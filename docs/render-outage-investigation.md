# Render Outage Investigation

**The root cause has not been confirmed.** Neither Render dashboard access, service logs nor
deploy history were available — only the repository. This document ranks plausible causes by the
evidence available and gives the exact checks that confirm or rule each one out.

## 1. What the repository tells us

| Fact | Source |
|---|---|
| The Docker-based Render deployment was introduced on **2026-08-13** and nothing was committed after it | `git log` — `f4c49e28` |
| The service used Render **Free** web service + **Free** PostgreSQL | Project brief |
| Free PostgreSQL databases **expire 30 days after creation**, are inaccessible afterwards, and are **deleted with their data after a 14-day grace period** (Render emails before each step) | [Render: Deploy for Free](https://render.com/docs/free) |
| Free web services **spin down after 15 minutes without traffic** and take up to about a minute to wake | Render free tier docs |
| Free instances have **512 MB RAM** | Render free tier docs |
| The old image ran `php artisan migrate --force` on every boot | `docker/entrypoint.sh` @ `f4c49e28` |
| The old image had no `php.ini` and Apache's default 150 prefork workers | `Dockerfile` @ `f4c49e28` |
| No trusted proxies were configured | `bootstrap/app.php` @ `f4c49e28` |

## 2. Possible root causes, ranked

| Rank | Cause | Why it is plausible | Symptom you would see | Evidence that confirms it |
|---|---|---|---|---|
| **1** | **Free PostgreSQL expired** | ~3 months since the deploy commit; 30-day limit | App boots then fails: `SQLSTATE[08006] could not connect` / `could not translate host name`; with the old entrypoint, `migrate --force` fails → `set -e` → **container exits → deploy fails / restart loop** | DB page shows *Expired* / *Suspended* or is missing; Render expiry emails; deploy logs with `migrate` connection errors |
| 2 | Deleted DB → `DATABASE_URL` points to nothing | Follows from #1 after the grace period | Same as #1, host no longer resolves | Database missing from the dashboard; the env var still references `dpg-...` |
| 3 | Wrong / missing environment variables | Manual dashboard configuration, no blueprint | Boot crash: `No application encryption key` (APP_KEY), or 500 on every page | Render *Environment* tab; logs showing `MissingAppKeyException` |
| 4 | Failed health check | Health check path set to `/` or another route that touches the DB; DB down → health fails | Deploy stuck *"in progress"* then *failed*; *"Timed out"* in events | Settings → Health Check Path; Events tab |
| 5 | Out of memory | 512 MB, mod_php with up to 150 workers, ~40 MB each | Random restarts, *"Ran out of memory"* event, 502 | Events tab → *Instance failed: out of memory*; Metrics → memory at limit |
| 6 | Asset build failure | `npm ci` + Wayfinder (`php artisan`) during image build; native optional deps | Build fails, previous version keeps running (**so not an outage by itself**) | Deploy log ends in `npm run build` error |
| 7 | PHP runtime incompatibility | PHP 8.4 image, `composer.json` allows `^8.2`; packages need 8.2+ | Build fails at `composer install` | Build log `requires php` errors |
| 8 | Wrong start command / port | Old entrypoint `sed`-replaced port 80 → `$PORT` | *"No open ports detected"*, deploy times out | Deploy log *"Port scan timeout"* |
| 9 | Application exception (500, not down) | Mixed content / http redirects without trusted proxies; F10 attendance bug | Site loads but pages broken / unstyled / redirect to `http://` | Browser console *Mixed Content*; logs with stack traces |
| — | **Cold start (not an outage)** | Free tier sleeps after 15 min | First request takes ~30–60 s, then normal | *"Service spun down"* / *"Service waking up"* events; it eventually responds |

> Cold starts vs. outages: a cold start is slow but succeeds. An outage keeps failing after the
> service has woken up. Check with `curl -m 120 https://<app>/up` twice, one minute apart.

## 3. Recovery procedures

### If the database expired but is still in the 14-day grace period
1. **Do not create a new free DB yet and do not redeploy with migrations.**
2. Either upgrade the existing DB's instance type to a paid plan (data is kept), **or** export it first:
   Render → Database → *Recovery / Export* (logical export), or `scripts/db/backup.sh` with the External URL.
3. Verify the backup: `scripts/db/verify-backup.sh backups/<file>.dump`.
4. Continue with [database-backups.md → Migrating to a new provider](database-backups.md#migrating-to-a-new-provider).

### If the database was deleted
Render does not keep free-tier backups. Check whether **any** copy exists (local dumps, the
`school_management.dbml` design is schema only). **Do not assume there was no important data** — ask
the people who used it. If no copy exists, recovery is: new persistent DB → `RUN_MIGRATIONS=true` →
seed reference data → re-enter data. Record this as a data-loss incident.

### For causes 3–9
Deploy this branch: the new entrypoint validates `APP_KEY`, `APP_DEBUG` and DB settings and prints a
clear error; memory and proxies are fixed; the smoke test reports exactly which check fails.

## 4. Preventive measures (implemented)

| Risk | Prevention |
|---|---|
| Free DB expiry / data loss | Persistent provider (pending) + daily encrypted off-site backups (`.github/workflows/db-backup.yml`) + restore verification |
| Silent bad deploys | Auto-deploy off; deploys only after CI, by SHA; post-deploy smoke test verifies the live release |
| Config mistakes | Fail-fast entrypoint checks; `render.yaml` documents every variable |
| OOM | Bounded Apache workers, OPcache, PHP memory limit |
| Health check flapping on DB outage | Render checks `/up` (no DB); `/health/ready` for monitoring |
| Unnoticed downtime | Uptime monitoring on `/health/ready` (to configure, [monitoring.md](monitoring.md)) |

## 5. Owner checklist (Render Dashboard)

Run these in order and note the answers — they identify the root cause.

- [ ] **Databases** list: does the PostgreSQL instance still exist? Status (*Available / Expired / Suspended*)? Creation date and plan?
- [ ] Your email inbox: search for *"Render" "database" "expire"*. Dates?
- [ ] **Web service → Events**: last deploy status and time; any *"out of memory"*, *"health check failed"*, *"port scan timeout"*?
- [ ] **Web service → Logs**: around the failure time, search for `SQLSTATE`, `APP_KEY`, `Allowed memory`, `Killed`, `Port`.
- [ ] **Settings**: Health Check Path, Branch, Auto-Deploy, Dockerfile path, Region, Instance type.
- [ ] **Environment**: which of `APP_KEY`, `APP_URL`, `DATABASE_URL`, `DB_CONNECTION`, `APP_ENV`, `APP_DEBUG` are set (never paste values anywhere).
- [ ] `curl -sS -m 120 -o /dev/null -w '%{http_code} %{time_total}s\n' https://<your-service>.onrender.com/up` — twice, 60 s apart.
- [ ] If the DB is reachable: `export DATABASE_URL='<External Database URL>'` then `scripts/db/check.sh --counts` and **immediately** `scripts/db/backup.sh`.

Write the findings into this file under *Findings* below, then fix the cause.

## Findings

_To be filled in by the owner after the checklist._
