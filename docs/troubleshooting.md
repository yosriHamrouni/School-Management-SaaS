# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Container exits: `APP_KEY is not set` | Missing env var on Render | Set `APP_KEY` (original value) |
| `Refusing to start: APP_DEBUG=true` | Debug left on in production | `APP_DEBUG=false` |
| `DB_CONNECTION=pgsql but none of DB_URL, DATABASE_URL or DB_HOST is set` | DB env missing | Set `DATABASE_URL` |
| `SQLSTATE[08006]` / `could not translate host name "dpg-…"` | Database expired, deleted or wrong URL | [render-outage-investigation.md](render-outage-investigation.md) |
| `/health/ready` 503 but `/up` 200 | App fine, database unreachable | Check DB status/credentials; `scripts/db/check.sh` |
| First request takes ~1 min, then normal | Render Free cold start | Expected; upgrade plan to remove |
| Pages unstyled, console *Mixed Content* | Proxy headers/APP_URL | `APP_URL=https://…`, `APP_FORCE_HTTPS=true` (trusted proxies are configured) |
| Login loops / 419 Page Expired | Cookie not `Secure`/domain mismatch or `APP_KEY` changed | `SESSION_DOMAIN` empty, `SESSION_SECURE_COOKIE=true`, keep original key |
| Uploaded file missing after deploy | Ephemeral filesystem | Known limitation (audit F7) |
| `Instance failed: out of memory` | Too many workers | Lower `APACHE_MAX_REQUEST_WORKERS` (e.g. 6) |
| Users see an old UI after deploy | PWA service worker | Reload twice; `sw.js` is served `no-cache` |
| Deploy job: `deploy hook returned HTTP 404` | SHA not on the service's branch / wrong repo | Deploy only commits pushed to `main` |
| Deploy job: smoke test timed out on release | Build slow, or `RENDER_GIT_COMMIT` not exposed | Check Render Events; the job also accepts the Render API status |
| Backend CI: `Tests aborted: the database must be SQLite in memory…` | Running tests against a non-test DB | Use `:memory:`, or `TESTING_ALLOW_PGSQL=true` with a DB named `*_test` |
| `pg_dump: server version mismatch` | Client older than server | `PG_CLIENT_IMAGE=postgres:<major>-alpine scripts/db/backup.sh` |
| `composer.bat` ate `^` in constraints (Windows) | cmd escaping | Quote with `"^^3.14"` or edit composer.json and run `composer update --lock` |
| Docker Desktop: Trivy can't inspect image | Socket timeout | `docker save` then `trivy image --input image.tar` |

Running the test suite on PostgreSQL locally:
```bash
docker compose up -d db
docker compose exec db psql -U school -d school_management -c "CREATE DATABASE testing"
TESTING_ALLOW_PGSQL=true DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=54329 \
  DB_DATABASE=testing DB_USERNAME=school DB_PASSWORD=school-local-only DB_URL= \
  php vendor/bin/pest
```
