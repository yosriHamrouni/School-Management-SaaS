#!/usr/bin/env bash
# shellcheck disable=SC2016  # single-quoted $PGURL/$0 are expanded inside the pg container, by design
# Shared helpers for database scripts. Source, do not execute.
#
# All PostgreSQL client tools run inside a pinned Docker image, so no local
# psql/pg_dump installation is needed and client/server versions are explicit.
# The connection string is passed through the DATABASE_URL *environment
# variable* (never as a CLI argument) so it does not appear in shell history,
# `ps` output or CI logs.

set -euo pipefail

# pg_dump must be >= the server's major version. Override if the server is newer:
#   PG_CLIENT_IMAGE=postgres:18-alpine scripts/db/backup.sh
PG_CLIENT_IMAGE="${PG_CLIENT_IMAGE:-postgres:17-alpine}"

export MSYS_NO_PATHCONV=1 # Git Bash on Windows: do not rewrite /paths

log()  { printf '[db] %s\n' "$*" >&2; }
fail() { printf '[db] ERROR: %s\n' "$*" >&2; exit 1; }

require_docker() {
    command -v docker >/dev/null 2>&1 || fail "docker is required."
    docker info >/dev/null 2>&1 || fail "docker daemon is not running."
}

require_url() {
    local var="${1:-DATABASE_URL}"
    [ -n "${!var:-}" ] || fail "$var is not set. Export it first (Render dashboard -> Database -> External Database URL). It is read from the environment and never printed."
}

# Absolute host path usable in `docker run -v` (handles Git Bash on Windows).
host_path() {
    (cd "$1" && (pwd -W 2>/dev/null || pwd))
}

# Run a command in the PostgreSQL client container.
#   pg_exec <url-env-var> <workdir-or-empty> <command...>
# Inside the container the URL is available as $PGURL.
pg_exec() {
    local url_var="$1" workdir="$2"
    shift 2
    local mount=()
    if [ -n "$workdir" ]; then
        mount=(-v "$(host_path "$workdir"):/work" -w /work)
    fi
    PGURL="${!url_var}" docker run --rm -i \
        -e PGURL \
        -e PGCONNECT_TIMEOUT=15 \
        -e PGAPPNAME=school-management-dbtools \
        "${mount[@]}" \
        "$PG_CLIENT_IMAGE" "$@"
}

# Exact row counts for every table in the public schema, "table|count" per line.
ROW_COUNT_SQL="DO \$\$ DECLARE r record; n bigint; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.tablename) INTO n;
    RAISE NOTICE '%|%', r.tablename, n;
  END LOOP; END \$\$;"

row_counts() {
    # NOTICE lines go to stderr; turn "psql:...: NOTICE:  table|n" into "table|n".
    pg_exec "$1" "" sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -q -c "$0" 2>&1 >/dev/null' "$ROW_COUNT_SQL" \
        | sed -n 's/.*NOTICE:  //p' | sort
}

# psql does not expand $PGURL from argv; wrap single queries in sh -c.
psql_query() {
    local url_var="$1" sql="$2"
    pg_exec "$url_var" "" sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -At -c "$0"' "$sql"
}

server_major_version() {
    local num
    num="$(psql_query "$1" "SHOW server_version_num")"
    echo $(( num / 10000 ))
}

client_major_version() {
    docker run --rm "$PG_CLIENT_IMAGE" sh -c 'pg_dump --version' | sed -E 's/[^0-9]*([0-9]+).*/\1/'
}
