# Render Deployment

Render stays the hosting provider. The service is a **Git-backed Docker web service** that Render
builds from `Dockerfile`, with **auto-deploy off**: only GitHub Actions deploys, after CI passes,
by commit SHA.

## Git-backed vs image-backed

| | Git-backed (chosen) | Image-backed (GHCR) |
|---|---|---|
| Who builds | Render, from the commit | GitHub Actions, pushes `ghcr.io/...:<sha>` |
| Deployed artifact = scanned artifact | No (rebuilt from same commit + pinned bases) | **Yes**, byte-identical |
| Extra secrets | Deploy hook only | Deploy hook + registry pull credential on Render + `packages: write` in CI |
| Rollback | Redeploy previous commit (rebuild) or Render *Rollback* | Instant: previous image tag |
| Cost | Free | Free (GHCR) |

For a single free instance the Git-backed model has less secret surface and fewer moving parts.
Switch to image-backed when deploy speed or artifact identity matters (team, compliance):
build with `docker/build-push-action` `push: true`, tags `ghcr.io/<owner>/school-management:${{ github.sha }}`,
then call the hook with `?imgURL=<url-encoded image ref>`; never overwrite SHA tags so every previous release stays deployable.

## One-time setup

### Render dashboard (web service)
| Setting | Value |
|---|---|
| Runtime | Docker, Dockerfile path `./Dockerfile`, context `.` |
| Branch | `main` |
| **Auto-Deploy** | **Off** (Settings → Build & Deploy) — prevents deploys before CI passes and duplicate deploys |
| Health Check Path | `/up` |
| Instance | Free (cold starts) or Starter ($7/mo, always on) |
| Region | Same as the database |
| Environment | as listed in `render.yaml`; secrets: `APP_KEY`, `APP_URL`, `DATABASE_URL` |

Generate `APP_KEY` once and **never change it** (it encrypts sessions and 2FA secrets):
`docker run --rm school-management:local php artisan key:generate --show`.

Alternatively apply `render.yaml` as a Blueprint — read its header first (it adopts the service by name).

### GitHub
| Where | Name | Value |
|---|---|---|
| Settings → Environments → **production** → Secrets | `RENDER_DEPLOY_HOOK_URL` | Render → Settings → Deploy Hook |
| … production → Variables | `RENDER_APP_URL` | `https://<service>.onrender.com` |
| … production → Variables *(optional)* | `RENDER_SERVICE_ID` | `srv-…` (enables deploy-status polling) |
| Repository or environment secret *(optional)* | `RENDER_API_KEY` | Render → Account → API Keys |
| Environment **staging** *(optional)* | same names | a second Render service on branch `development` |
| Environment protection *(recommended)* | Required reviewers on `production`, branch rule `main` | |

The deploy hook is a credential: anyone holding it can trigger deploys. It is only ever read from
secrets, never echoed; if it leaks, regenerate it in Render.

## How a production deploy works

1. Push/merge to `main` → `ci.yml` runs backend, frontend, docker, security in parallel.
2. If **all** pass, `deploy-production` calls `deploy-render.yml` with `ref = github.sha`.
3. Concurrency group `render-deploy-production` queues deploys (no parallel, no cancellation).
4. `POST <hook>?ref=<sha>` — Render builds exactly that commit.
5. If API key + service ID are set: poll the deploy until `live` / `build_failed` / `update_failed`.
6. `scripts/smoke-test.sh` waits (up to 30 min, covers free-tier builds and cold starts) until
   `/health/ready` reports `release == <sha>` (Render's `RENDER_GIT_COMMIT`), then runs 15 checks
   including HTTPS, Secure cookies, HSTS, assets and no mixed content.
7. The job summary shows the result; failure = not verified (Render keeps the previous version serving
   when a build or health check fails).

## Manual deploy / rollback
GitHub → Actions → **Deploy to Render** → *Run workflow* → environment + full SHA of a known-good commit.
Or Render → Events → *Rollback* on a previous deploy. See [disaster-recovery.md](disaster-recovery.md).

## Migrations on Render
`RUN_MIGRATIONS=true` runs `php artisan migrate --force` at container start (Free tier has no
pre-deploy command). On a paid instance prefer Render's **Pre-Deploy Command**
`php artisan migrate --force` and set `RUN_MIGRATIONS=false`, so a failed migration blocks the release
instead of crash-looping the new instance.

## Free-tier behaviour
The service sleeps after 15 minutes without traffic; the next request waits up to ~1 minute.
That is expected, not an outage. **Do not use pinging services to keep it awake** — it violates the
spirit of the free tier; upgrade to Starter if users need instant responses.
