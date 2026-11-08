# Docker Setup

## Quick start (local)

```bash
docker compose up -d --build      # app + PostgreSQL 17, migrations run automatically
docker compose exec app php artisan db:seed   # optional demo data
```
App: <http://localhost:8000> (change with `APP_PORT=8080 docker compose up -d`) ·
PostgreSQL: `127.0.0.1:54329`, user/db `school` / `school_management`, password `school-local-only` (local only).

| Command | |
|---|---|
| `docker compose logs -f app` | follow logs |
| `docker compose exec app php artisan app:health-check` | DB check from inside |
| `docker compose down` | stop, keep data (volumes `db-data`, `app-storage`) |
| `docker compose down -v` | stop and **delete local data** |
| `scripts/smoke-test.sh http://localhost:8000` | end-to-end checks |

Optional `.env.docker` (git-ignored) adds/overrides variables, e.g. a fixed `APP_KEY` so sessions
survive restarts. Compose deliberately does not interpolate from your Laravel `.env`.

Redis is **not** included: there are no queued jobs, and sessions/cache work on the database. Add it
only if queue workers or heavy caching are introduced.

## Image

`Dockerfile` stages:

| Stage | Base | Does |
|---|---|---|
| `php-base` | `php:8.4.27-apache-bookworm` | Extensions via `install-php-extensions` (bcmath gd intl pcntl pdo_pgsql pgsql sockets zip; OPcache built in), `php.ini-production`, hardened Apache |
| `vendor` | php-base + `composer:2.11` | `composer install --no-dev` in its own cached layer, optimized autoloader |
| `assets` | php-base + Node 22 binaries | `npm ci` cached layer, `npm run build` (Wayfinder needs `php artisan`) |
| `production` | php-base | Copies vendor + `public/build`, caches routes/views/events, runs as **UID 33** |

Build for Render's architecture: `docker build --platform linux/amd64 -t school-management:local .`

### Runtime contract
* Listens on **`$PORT`** (Render injects it; default 10000) — Apache reads `${PORT}` directly.
* `docker/entrypoint.sh` fails fast on: non-numeric `PORT`, missing `APP_KEY` in production,
  `APP_DEBUG=true` in production, `DB_CONNECTION=pgsql` without a host/URL. Locally it generates an
  ephemeral key if none is set.
* `RUN_MIGRATIONS=true` → forward-only `migrate --force` before start. Default in the image: `false`.
* Config is cached at boot (it depends on runtime env); routes, views and events at build time.
* `HEALTHCHECK` → `GET /up`. Render uses its own HTTP health check (`/up`).

### Hardening
* Non-root (UID/GID 33), `storage/` and `bootstrap/cache` owner-only writable, no Composer in the final image.
* `display_errors=Off`, `expose_php=Off`, `ServerTokens Prod`, `TraceEnable Off`, dotfiles denied.
* Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`;
  HSTS only when the request arrived over HTTPS (`X-Forwarded-Proto`).
* Memory: OPcache (128 MB, no stat), `memory_limit=256M`, prefork `MaxRequestWorkers=${APACHE_MAX_REQUEST_WORKERS}` (10 default, 8 on Render Free).
* Uploads: `upload_max_filesize=12M`, `post_max_size=14M` (app validates 10 MB).
* Immutable caching for `/build/assets/*`, `no-cache` for the PWA service worker.
* `.dockerignore` excludes `.env*`, git, tests, docs, `ml/` (no Python in the image), backups.

### Measured locally (2026-11-06)
Build OK (linux/amd64) · Compose healthy in ~25 s on a fresh DB (all 40 migrations) · idle RSS ≈ 53 MB ·
smoke test 12/12 (local) and 15/15 (production mode + simulated TLS proxy) · Hadolint clean · Trivy 0 fixable HIGH/CRITICAL.
