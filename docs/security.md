# Security

## Automation

| Control | Where | Gate |
|---|---|---|
| Dependabot (Composer, npm, Actions, Docker, Compose) | `.github/dependabot.yml` | Grouped weekly PRs, majors ignored except security updates |
| Composer audit | `ci.yml` security job, weekly sweep | **Fails** on any advisory |
| npm audit | same | **Fails** on HIGH+ in runtime deps; dev deps warn |
| Trivy image scan | `ci.yml` docker job, weekly fresh build | Reports HIGH+CRITICAL, **fails on fixable CRITICAL** (weekly: fails on HIGH too) |
| Trivy config scan | docker job | Report only |
| Hadolint | docker job | Fails on warnings |
| Gitleaks secret scan | security job (push/PR range), weekly (full history) | **Fails** |
| Larastan level 5 | backend job | Fails on new findings |
| GitHub Actions hardening | all workflows | SHA-pinned actions, `contents: read`, no persisted credentials, env-passed event data |

Enable on GitHub as well: Settings → Code security → **Secret scanning + push protection**, Dependabot
alerts; branch protection on `main` requiring the four CI checks.

## Results on 2026-11-06 (local)

* `composer audit`: **72 advisories in 16 packages → 0** after patch/minor updates within the existing majors
  (laravel/framework 12.54.1→12.71.0, phpspreadsheet 1.30.3→1.30.7, maatwebsite/excel 3.1.68→3.1.70, guzzle, commonmark, symfony/*…). Full Pest suite: no regressions.
* `npm audit`: **38 advisories (2 critical, 16 high) → runtime 0** with `npm audit fix` (no `--force`,
  lockfile only, no range changes). Note: build tools such as `vite` and `concurrently` are listed under
  `dependencies`, so npm treats them as runtime. 13 dev-only advisories remain (1 high: `brace-expansion`
  ReDoS, nested in build tooling, needs an upstream bump) → CI warns, does not fail.
* Trivy (image built from the patched lock): **0 fixable HIGH/CRITICAL** (OS and PHP packages).
* Gitleaks, full history: 7 findings, all false positives in a historically committed Python virtualenv
  (`ml/.venv`, numpy test seeds) → allowlisted with justification in `.gitleaks.toml`. **No real secrets in history.**
* Hadolint: clean with one documented exception (DL3008).

## Justified exceptions

| Exception | Reason |
|---|---|
| Hadolint DL3008 (unpinned apt packages) | Pinning Debian package versions breaks builds on every security update; the base image tag is pinned and bumped by Dependabot, and Trivy scans the OS layer. |
| Gitleaks allowlist `ml/.venv/` | Third-party library test fixtures, removed from the tree in `f4c49e28`. |
| `trivy-action` not used | March 2026 tag-hijack (CVE-2026-33634). The digest-pinned `aquasec/trivy` image is used instead. |
| `.trivyignore` | Empty. Any entry needs reason, owner, review date. |

## Application / runtime

* Secrets live only in Render env vars and GitHub encrypted secrets; `.env*` excluded from git and image.
* Production refuses to boot with `APP_DEBUG=true` or without `APP_KEY`.
* `DB::prohibitDestructiveCommands()` in production; strong password policy in production (existing).
* HTTPS: trusted proxy, `APP_FORCE_HTTPS`, `SESSION_SECURE_COOKIE=true`, HSTS, HttpOnly + SameSite=Lax cookies.
* Container: non-root UID 33, no compilers/Composer in the final image, minimal writable paths.
* Health endpoints leak no internals (tested).

## Open items (need owner decision)
1. Uploaded submissions are on an ephemeral, `public` disk; move to a private bucket with signed URLs.
2. `.env.example` ships sample Reverb credentials (`schoolmanagementsecret`) — fine as examples, but make sure the real deployment never reuses them.
3. Rotate any credential ever used with the expired Render database once a new database exists.
