#!/usr/bin/env bash
# shellcheck disable=SC2016  # single-quoted $PGURL/$0 are expanded inside the pg container, by design
# Restore a backup into a TARGET database (e.g. a new Neon / paid Render DB).
#
#   export TARGET_DATABASE_URL='postgresql://...'      # the NEW, EMPTY database
#   scripts/db/restore.sh backups/production-XXXX.dump --confirm <target-db-name>
#
# Safety rails:
#   * Uses TARGET_DATABASE_URL (not DATABASE_URL) so a source URL exported for
#     backups can never be restored over by accident.
#   * Requires --confirm with the exact target database name.
#   * Refuses to restore into a database that already has tables in "public"
#     (no --clean, no DROP). Empty the target yourself if you really mean it.
#   * Single transaction: on any error, nothing is written.
#   * Verifies the backup (checksum) first and compares row counts afterwards.

set -euo pipefail
# shellcheck source=scripts/db/_common.sh
. "$(dirname "$0")/_common.sh"

dump="${1:-}"
[ -n "$dump" ] && [ -f "$dump" ] || fail "usage: $0 <file.dump> --confirm <target-db-name>"
[ "${2:-}" = "--confirm" ] && [ -n "${3:-}" ] || fail "usage: $0 <file.dump> --confirm <target-db-name>"
confirm_name="$3"

require_docker
require_url TARGET_DATABASE_URL

dir="$(dirname "$dump")"
file="$(basename "$dump")"
manifest="$dir/${file%.dump}.manifest"

if [ -f "$dump.sha256" ]; then
    if command -v sha256sum >/dev/null 2>&1; then (cd "$dir" && sha256sum -c "$file.sha256" >/dev/null)
    else (cd "$dir" && shasum -a 256 -c "$file.sha256" >/dev/null); fi || fail "Checksum mismatch: refusing to restore a corrupted dump."
fi

target_info="$(psql_query TARGET_DATABASE_URL "SELECT current_database() || '|' || (SELECT count(*) FROM pg_tables WHERE schemaname = 'public')")" \
    || fail "Cannot connect to the target database."
IFS='|' read -r target_db target_tables <<<"$target_info"

[ "$target_db" = "$confirm_name" ] || fail "--confirm '$confirm_name' does not match the target database name '$target_db'."
[ "$target_tables" -eq 0 ] || fail "Target database '$target_db' already has $target_tables tables in schema public. Refusing to overwrite."

log "Restoring $file into '$target_db' (single transaction)..."
pg_exec TARGET_DATABASE_URL "$dir" sh -c \
    'pg_restore --dbname="$PGURL" --no-owner --no-privileges --exit-on-error --single-transaction "$0"' "$file" \
    || fail "Restore failed; the transaction was rolled back and the target is unchanged."

if [ -f "$manifest" ]; then
    log "Comparing row counts with manifest..."
    expected="$(grep -v '^#' "$manifest" | grep '|' | sort)"
    restored="$(row_counts TARGET_DATABASE_URL)"
    if [ "$expected" = "$restored" ]; then
        log "VERIFIED: target row counts match the backup manifest."
    else
        log "WARNING: row counts differ from the manifest:"
        diff <(printf '%s\n' "$expected") <(printf '%s\n' "$restored") >&2 || true
        exit 3
    fi
fi

log "Done. Next: point the Render web service DATABASE_URL at the new database and redeploy."
