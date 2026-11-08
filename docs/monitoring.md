# Health Checks and Observability

## Endpoints

| Endpoint | Purpose | Touches DB | Session/cookies | Used by |
|---|---|---|---|---|
| `GET /up` | Liveness (framework boots) | No | No | Render health check, Docker `HEALTHCHECK` |
| `GET /health/ready` | Readiness: DB `select 1` | Yes | **No** (outside the `web` group) | Smoke tests, uptime monitor |
| `php artisan app:health-check [--json]` | Same probe from a shell/cron | Yes | — | Operators |

`/health/ready` response (200 or 503, `Cache-Control: no-store`):
```json
{"status":"ok","checks":{"database":{"status":"ok","latency_ms":12}},"release":"<git sha>","timestamp":"..."}
```
Failures are logged as `Readiness probe: database check failed.` with the exception **class** only.

Why Render checks `/up` and not `/health/ready`: if the database has an outage, restarting the web
container cannot fix it, and a failing health check would put the service into a restart loop.
Readiness is what users experience, so that is what external monitoring watches.

## Logs
`LOG_CHANNEL=stderr`, `LOG_LEVEL=info` → Render → Logs (Free tier keeps a short history; export or
add a log stream for retention). Apache access logs include the real client IP (`mod_remoteip`) and
exclude health probes. The entrypoint logs release, port and migration status at every boot.

## Deployment verification
`scripts/smoke-test.sh <url> <sha>` (15 checks) runs after every CI deploy and in CI against the
built image. A failed deploy is reported in the GitHub job summary with rollback instructions.

## Recommended external services (free tiers, not yet configured)

| Service | Setup | Why |
|---|---|---|
| **UptimeRobot** (or Better Stack) | HTTP keyword monitor on `https://<app>/health/ready`, keyword `"status":"ok"`, every 5 min, e-mail alert | Detects real outages and DB loss |
| **Sentry** (`sentry/sentry-laravel`) | `composer require sentry/sentry-laravel`, set `SENTRY_LARAVEL_DSN`, `send_default_pii=false`, scrub request bodies | Stack traces for 500s with release tagging (`APP_RELEASE`) |

**Cold starts vs outages:** on Render Free the first request after 15 idle minutes can take up to
~1 minute. A 5-minute monitor will often *wake* the service — that is a side effect, not the goal;
do not add aggressive pinging to defeat sleeping. Configure the monitor with a 90 s timeout and
alert after 2 consecutive failures so a cold start is not reported as downtime.

**Prometheus/Grafana:** not justified for one free instance with no worker fleet — it would cost more
to run than the application. Revisit with multiple instances or an SLO.
