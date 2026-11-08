#!/usr/bin/env bash
# shellcheck disable=SC2015  # "a && ok || bad": ok() always returns 0, so it is a safe if/else.
# Post-deployment smoke test. Read-only: issues GET requests only.
#
#   scripts/smoke-test.sh <base-url> [expected-release]
#
# Examples:
#   scripts/smoke-test.sh http://localhost:8000
#   scripts/smoke-test.sh https://school-management.onrender.com "$GITHUB_SHA"
#
# Environment:
#   SMOKE_WAIT_SECONDS  how long to wait for the service to come up (default 600;
#                       covers Render free-tier cold starts and slow Docker deploys)
#   SMOKE_REQUIRE_HTTPS set to "true" to also assert HTTPS-only behaviour
#   SMOKE_FORWARDED_PROTO  send X-Forwarded-Proto (e.g. "https") to simulate a
#                       TLS-terminating proxy when testing a container directly in CI

set -euo pipefail

curl_args=(-sS --max-time 60)
if [ -n "${SMOKE_FORWARDED_PROTO:-}" ]; then
    curl_args+=(-H "X-Forwarded-Proto: ${SMOKE_FORWARDED_PROTO}")
fi

base="${1:?usage: $0 <base-url> [expected-release]}"
base="${base%/}"
expected_release="${2:-}"
wait_seconds="${SMOKE_WAIT_SECONDS:-600}"
require_https="${SMOKE_REQUIRE_HTTPS:-false}"
case "$base" in https://*) require_https=true ;; esac

pass=0; failures=0
ok()   { printf '  PASS  %s\n' "$*"; pass=$((pass + 1)); }
bad()  { printf '  FAIL  %s\n' "$*"; failures=$((failures + 1)); }
info() { printf '[smoke] %s\n' "$*"; }

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

fetch() { # fetch <path> -> writes body/headers, prints status code
    curl "${curl_args[@]}" -o "$tmp/body" -D "$tmp/headers" -w '%{http_code}' "$base$1" || echo 000
}

# 1. Wait until the service answers (cold start / deploy in progress) and,
#    when given, until the expected release is live.
info "Waiting up to ${wait_seconds}s for $base (release: ${expected_release:-any})..."
deadline=$(( $(date +%s) + wait_seconds ))
live_release=""
while :; do
    code="$(fetch /health/ready)"
    if [ "$code" = 200 ]; then
        live_release="$(sed -n 's/.*"release":"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/p' "$tmp/body")"
        if [ -z "$expected_release" ] || [ "$live_release" = "$expected_release" ]; then
            break
        fi
    fi
    if [ "$(date +%s)" -ge "$deadline" ]; then
        info "Timed out (last status: $code, live release: ${live_release:-unknown})."
        [ -s "$tmp/body" ] && head -c 500 "$tmp/body" && echo
        exit 1
    fi
    sleep 10
done
info "Service is up (live release: ${live_release:-n/a})."

# 2. Checks.
[ "$(fetch /up)" = 200 ] && ok "GET /up -> 200 (liveness)" || bad "GET /up did not return 200"

code="$(fetch /health/ready)"
if [ "$code" = 200 ] && grep -q '"status":"ok"' "$tmp/body" && grep -q '"database":{"status":"ok"' "$tmp/body"; then
    ok "GET /health/ready -> 200, database ok"
else
    bad "GET /health/ready unhealthy (status $code): $(head -c 300 "$tmp/body")"
fi
if grep -qiE 'sqlstate|password|postgres(ql)?://|exception' "$tmp/body"; then
    bad "/health/ready leaks internal details"
else
    ok "/health/ready exposes no internal details"
fi
if grep -qi '^set-cookie:' "$tmp/headers"; then bad "/health/ready sets cookies (would create sessions)"; else ok "/health/ready sets no cookies"; fi

code="$(fetch /)"
if [ "$code" = 200 ]; then ok "GET / -> 200"; else bad "GET / returned $code"; fi
cp "$tmp/body" "$tmp/home.html"
grep -q 'data-page=' "$tmp/home.html" && ok "Home page renders the Inertia root" || bad "Inertia root element (data-page) not found on /"

asset="$(grep -oE '/build/assets/[^"]+\.js' "$tmp/home.html" | head -1 || true)"
if [ -n "$asset" ]; then
    # Fetch through the base URL (the page may reference the public APP_URL host).
    url="$base$asset"
    acode="$(curl "${curl_args[@]}" -o /dev/null -D "$tmp/aheaders" -w '%{http_code}' "$url" || echo 000)"
    [ "$acode" = 200 ] && ok "Compiled asset is served ($asset)" || bad "Compiled asset returned $acode ($url)"
    grep -qi 'cache-control:.*immutable' "$tmp/aheaders" && ok "Assets are cached as immutable" || bad "Assets missing immutable Cache-Control"
else
    bad "No /build/assets/*.js reference found on / (Vite manifest problem?)"
fi

code="$(fetch /login)"
[ "$code" = 200 ] && ok "GET /login -> 200" || bad "GET /login returned $code"
grep -qi '^x-content-type-options: nosniff' "$tmp/headers" && ok "Security headers present" || bad "X-Content-Type-Options header missing"
if grep -qi '^x-powered-by:' "$tmp/headers"; then bad "X-Powered-By header exposes PHP version"; else ok "No X-Powered-By header"; fi

if [ "$require_https" = true ]; then
    if grep -qE '(src|href)="http://' "$tmp/home.html"; then
        bad "Page references http:// URLs over HTTPS (mixed content - trusted proxies / APP_URL?)"
    else
        ok "No mixed-content (http://) asset URLs"
    fi
    grep -qi '^set-cookie:.*secure' "$tmp/headers" && ok "Session cookie has Secure flag" || bad "Session cookie is missing the Secure flag (SESSION_SECURE_COOKIE)"
    grep -qi '^strict-transport-security:' "$tmp/headers" && ok "HSTS header present" || bad "HSTS header missing"
fi

code="$(fetch /.env)"
[ "$code" = 403 ] || [ "$code" = 404 ] && ok "/.env is not served ($code)" || bad "/.env returned $code"

echo
info "Result: $pass passed, $failures failed."
[ "$failures" -eq 0 ]
