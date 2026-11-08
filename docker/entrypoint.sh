#!/bin/sh
# Container entrypoint (runs as www-data).
#
# Responsibilities:
#   1. Validate required runtime configuration and fail fast with a clear message.
#   2. Optionally run forward-only migrations (RUN_MIGRATIONS=true).
#   3. Cache configuration from the runtime environment.
#   4. exec the web server (PID 1 receives signals from Render).
set -eu

log() { printf '[entrypoint] %s\n' "$*" >&2; }

case "${PORT:-}" in
    ''|*[!0-9]*) log "PORT must be numeric (got '${PORT:-}')."; exit 1 ;;
esac

if [ -z "${APP_KEY:-}" ]; then
    if [ "${APP_ENV:-production}" = "production" ]; then
        log "APP_KEY is not set. Generate one with 'php artisan key:generate --show' and set it in the Render dashboard."
        exit 1
    fi
    # Local/CI convenience only: an ephemeral key (sessions reset on restart).
    APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
    export APP_KEY
    log "APP_KEY not set; generated an ephemeral key for APP_ENV=${APP_ENV}."
fi

if [ "${APP_ENV:-production}" = "production" ] && [ "${APP_DEBUG:-false}" = "true" ]; then
    log "Refusing to start: APP_DEBUG=true with APP_ENV=production would leak stack traces and secrets."
    exit 1
fi

if [ "${DB_CONNECTION:-}" = "pgsql" ] && [ -z "${DB_URL:-}${DATABASE_URL:-}${DB_HOST:-}" ]; then
    log "DB_CONNECTION=pgsql but none of DB_URL, DATABASE_URL or DB_HOST is set."
    exit 1
fi

mkdir -p storage/app/private storage/app/public storage/framework/cache/data \
         storage/framework/sessions storage/framework/views storage/logs

# Ensure no stale config cache from the build is used.
rm -f bootstrap/cache/config.php

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    # Forward-only. Destructive commands (migrate:fresh/reset/db:wipe) are
    # blocked in production by DB::prohibitDestructiveCommands() in
    # AppServiceProvider. (--isolated is deliberately not used: it needs the
    # cache_locks table, which does not exist yet on a freshly restored DB.)
    log "Running pending migrations (RUN_MIGRATIONS=true)..."
    php artisan migrate --force --no-interaction
else
    log "Skipping migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS:-false})."
fi

php artisan config:cache --no-interaction >/dev/null
log "Configuration cached. Release: ${APP_RELEASE:-${RENDER_GIT_COMMIT:-unknown}}. Listening on port ${PORT}."

exec "$@"
