#!/usr/bin/env bash
# shellcheck disable=SC2016  # single-quoted $PGURL/$0 are expanded inside the pg container, by design
# Create a verified logical backup of a PostgreSQL database. Read-only on the source.
#
#   export DATABASE_URL='postgresql://...'
#   scripts/db/backup.sh [label]            # default label: "production"
#
# Produces in ./backups/ (git-ignored):
#   <label>-<UTCtimestamp>.dump            pg_dump custom format (compressed)
#   <label>-<UTCtimestamp>.dump.sha256     checksum
#   <label>-<UTCtimestamp>.manifest        server version + exact row counts at dump time
#
# Then run scripts/db/verify-backup.sh <dump> to prove it restores.
#
# SECURITY: the dump contains personal and financial data of students and
# parents. Store it encrypted, off the laptop, and delete local copies after
# upload (see docs/database-backups.md).

set -euo pipefail
# shellcheck source=scripts/db/_common.sh
. "$(dirname "$0")/_common.sh"

label="${1:-production}"
case "$label" in *[!a-zA-Z0-9_-]*) fail "label may only contain letters, digits, - and _";; esac

require_docker
require_url DATABASE_URL

out_dir="${BACKUP_DIR:-backups}"
mkdir -p "$out_dir"
chmod 700 "$out_dir" 2>/dev/null || true
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="${label}-${stamp}"

server_major="$(server_major_version DATABASE_URL)" || fail "Cannot connect to the database (run scripts/db/check.sh for details)."
client_major="$(client_major_version)"
log "Server PostgreSQL $server_major, client pg_dump $client_major"
[ "$client_major" -ge "$server_major" ] || fail "pg_dump $client_major cannot dump a PostgreSQL $server_major server. Re-run with PG_CLIENT_IMAGE=postgres:${server_major}-alpine"

log "Recording row counts (consistency reference)..."
{
    echo "# backup manifest"
    echo "created_utc=$stamp"
    echo "label=$label"
    echo "server_major=$server_major"
    echo "client_image=$PG_CLIENT_IMAGE"
    echo "# table|rows"
    row_counts DATABASE_URL
} > "$out_dir/$base.manifest"

log "Dumping (custom format, no owner/ACLs so it restores on any provider)..."
pg_exec DATABASE_URL "$out_dir" sh -c \
    'pg_dump "$PGURL" --format=custom --compress=6 --no-owner --no-privileges --file="$0"' "$base.dump"

[ -s "$out_dir/$base.dump" ] || fail "Dump file is empty."

log "Validating archive table of contents..."
entries="$(pg_exec DATABASE_URL "$out_dir" pg_restore --list "$base.dump" | grep -c ' TABLE DATA ' || true)"
[ "$entries" -gt 0 ] || fail "Archive contains no TABLE DATA entries."

if command -v sha256sum >/dev/null 2>&1; then
    (cd "$out_dir" && sha256sum "$base.dump" > "$base.dump.sha256")
else
    (cd "$out_dir" && shasum -a 256 "$base.dump" > "$base.dump.sha256")
fi

size="$(du -h "$out_dir/$base.dump" | cut -f1)"
log "Backup complete: $out_dir/$base.dump ($size, $entries tables with data)"
log "Next: scripts/db/verify-backup.sh $out_dir/$base.dump"
