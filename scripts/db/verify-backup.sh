#!/usr/bin/env bash
# Prove a backup is restorable: restore it into a throwaway PostgreSQL container,
# compare per-table row counts with the manifest captured at backup time, then
# destroy the container. Never touches any real database.
#
#   scripts/db/verify-backup.sh backups/production-20261106T120000Z.dump

set -euo pipefail
# shellcheck source=scripts/db/_common.sh
. "$(dirname "$0")/_common.sh"

dump="${1:-}"
[ -n "$dump" ] && [ -f "$dump" ] || fail "usage: $0 <file.dump>"
require_docker

dir="$(dirname "$dump")"
file="$(basename "$dump")"
manifest="$dir/${file%.dump}.manifest"

if [ -f "$dump.sha256" ]; then
    log "Checking checksum..."
    if command -v sha256sum >/dev/null 2>&1; then (cd "$dir" && sha256sum -c "$file.sha256" >/dev/null)
    else (cd "$dir" && shasum -a 256 -c "$file.sha256" >/dev/null); fi || fail "Checksum mismatch: the dump is corrupted."
fi

server_major="$(sed -n 's/^server_major=//p' "$manifest" 2>/dev/null || true)"
image="postgres:${server_major:-17}-alpine"
name="sm-restore-verify-$$"
password="verify-$(date +%s)-$RANDOM"

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT

log "Starting throwaway $image ..."
docker run -d --name "$name" -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=restore_check \
    -v "$(host_path "$dir"):/backup:ro" "$image" >/dev/null

for _ in $(seq 1 120); do
    docker exec "$name" pg_isready -U postgres -d restore_check >/dev/null 2>&1 && break
    sleep 1
done
if ! docker exec "$name" pg_isready -U postgres -d restore_check >/dev/null 2>&1; then
    docker logs --tail 20 "$name" >&2 || true
    fail "Throwaway PostgreSQL did not start within 120s."
fi
# pg_isready can succeed during the init-time restart; give it a moment.
sleep 2

log "Restoring (single transaction, stop on first error)..."
docker exec "$name" pg_restore -U postgres -d restore_check --no-owner --no-privileges \
    --exit-on-error --single-transaction "/backup/$file" || fail "Restore FAILED - this backup is not usable."

log "Comparing row counts with manifest..."
restored="$(docker exec -e PGPASSWORD="$password" "$name" psql -U postgres -d restore_check -v ON_ERROR_STOP=1 -q -c "$ROW_COUNT_SQL" 2>&1 >/dev/null | sed -n 's/.*NOTICE:  //p' | sort)"

if [ ! -f "$manifest" ]; then
    log "No manifest found; restore succeeded but counts cannot be compared."
    printf '%s\n' "$restored" | awk -F'|' '{ printf "  %-40s %s\n", $1, $2 }'
    exit 0
fi

expected="$(grep -v '^#' "$manifest" | grep '|' | sort)"
if [ "$expected" = "$restored" ]; then
    tables="$(printf '%s\n' "$restored" | grep -c '|')"
    rows="$(printf '%s\n' "$restored" | awk -F'|' '{ s += $2 } END { print s }')"
    log "VERIFIED: $tables tables, $rows rows - identical to the source at backup time."
else
    log "MISMATCH between manifest and restored data:"
    diff <(printf '%s\n' "$expected") <(printf '%s\n' "$restored") >&2 || true
    exit 3
fi
