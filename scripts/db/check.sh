#!/usr/bin/env bash
# Database health check: connectivity, version, size, table/row inventory.
# Read-only. Safe to run against production.
#
#   export DATABASE_URL='postgresql://...'   # e.g. Render "External Database URL"
#   scripts/db/check.sh
#   scripts/db/check.sh --counts             # also print exact row counts per table

set -euo pipefail
# shellcheck source=scripts/db/_common.sh
. "$(dirname "$0")/_common.sh"

require_docker
require_url DATABASE_URL

log "Connecting (client image: $PG_CLIENT_IMAGE)..."
if ! info="$(psql_query DATABASE_URL "SELECT current_database() || '|' || split_part(version(), ' ', 2) || '|' || pg_size_pretty(pg_database_size(current_database())) || '|' || (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') || '|' || coalesce((SELECT max(batch)::text FROM migrations), 'n/a')" 2>&1)"; then
    # Show the error class only; libpq errors can include the hostname.
    log "Connection FAILED."
    printf '%s\n' "$info" | sed -E 's#postgres(ql)?://[^ ]+#<redacted-url>#g' | head -5 >&2
    exit 2
fi

IFS='|' read -r db version size tables batch <<<"$info"
log "Connection OK"
printf '  database        : %s\n' "$db"
printf '  server version  : %s\n' "$version"
printf '  size            : %s\n' "$size"
printf '  public tables   : %s\n' "$tables"
printf '  last migration  : batch %s\n' "$batch"

if [ "${1:-}" = "--counts" ]; then
    log "Exact row counts:"
    row_counts DATABASE_URL | awk -F'|' '{ printf "  %-40s %s\n", $1, $2 }'
fi
