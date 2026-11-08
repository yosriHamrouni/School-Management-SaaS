# Database Persistence, Backups and Recovery

The database holds grades, attendance, invoices and payments of minors and their parents.
It is the only component that cannot be rebuilt from git. Everything here is **read-only on the
source** except `restore.sh`, which only writes into an **empty** target you name explicitly.

## Choosing a provider

Render Free PostgreSQL is not an option for real data: it expires after 30 days and has no backups.

| | Render Postgres `basic-256mb` | Neon Free | Supabase Free |
|---|---|---|---|
| Cost | ~$6/mo + $0.30/GB/mo (≈ $6.30 for 1 GB) | $0 | $0 |
| Expiry / pausing | None | None; compute **scales to zero** (first query after idle ≈ 0.5–1 s) | **Pauses after 7 days of inactivity** |
| Backups | Continuous **PITR** (3 days on Hobby workspace, 7 on Pro) + logical exports | Limited history/restore window on Free | **None** on Free |
| Storage | Pay per GB, grow without downtime | 0.5 GB / project | 500 MB |
| Connections | 100 | Pooled endpoint (PgBouncer) | Pooler |
| Network | **Private network to the web service**, same region | Public internet + TLS | Public internet + TLS |
| Laravel | Plain `pgsql` | Plain `pgsql` (use the *pooled* host; `sslmode=require`) | Plain `pgsql` |

Prices from the providers' public pricing pages as of 2026-11; verify before purchase.

**Recommendation**
* **Real school data → Render `basic-256mb`**: same provider and region, private network, PITR,
  no new vendor, no code change. Cost ≈ $6–7/month. *Requires your approval (paid).*
* **Portfolio / demo at $0 → Neon Free** in `eu-central-1` (Frankfurt), plus the daily backup workflow below.
* Not Supabase Free: auto-pausing + no backups.

Either way, keep the **independent off-site backups** below — provider backups do not protect against
account loss, accidental deletion of the instance, or a bad migration older than the PITR window.

## Scripts

All scripts run the PostgreSQL client in Docker (`postgres:17-alpine`, override with
`PG_CLIENT_IMAGE`), read the connection string from an environment variable and never print it.

| Script | Purpose | Writes? |
|---|---|---|
| `scripts/db/check.sh [--counts]` | Connectivity, version, size, tables, last migration batch, exact row counts | No |
| `scripts/db/backup.sh [label]` | `pg_dump` custom format + SHA-256 + manifest of exact row counts | Local file only |
| `scripts/db/verify-backup.sh <dump>` | Checksum, restore into a **throwaway** container, diff row counts with the manifest | No (throwaway only) |
| `scripts/db/restore.sh <dump> --confirm <db>` | Restore into an **empty** target DB (`TARGET_DATABASE_URL`) in one transaction | Target only |
| `php artisan app:health-check` | Laravel-level DB check (inside the container) | No |

```bash
# 1. Point at the source (Render -> Database -> Connections -> External Database URL)
export DATABASE_URL='postgresql://...'

# 2. Inspect, back up, prove the backup restores
scripts/db/check.sh --counts
scripts/db/backup.sh production
scripts/db/verify-backup.sh backups/production-<timestamp>.dump
```

`backups/` is git-ignored and `chmod 700`. **Dumps contain personal data**: store them encrypted
(e.g. `gpg -c`) in a private location and delete local plaintext copies.

Tested locally (2026-11-06) against the Compose database with demo data: backup → verify
(38 tables, 696 rows identical) → restore into an empty DB (verified) → corrupted-dump detection →
all restore guard rails (wrong name, non-empty target, missing `--confirm`).

## Daily off-site backup (GitHub Actions)

`.github/workflows/db-backup.yml` runs daily at 02:30 UTC: backup → verify → **encrypt to your GPG
public key** → upload the ciphertext as an artifact (30-day retention). CI can encrypt but not decrypt.

Setup (once):
```bash
gpg --quick-gen-key "School Mgmt Backups <you@example.com>" default default never
gpg --armor --export "School Mgmt Backups" > backup-public.asc     # -> secret BACKUP_GPG_PUBLIC_KEY
gpg --armor --export-secret-keys "School Mgmt Backups" > KEEP-OFFLINE-private.asc   # store offline!
```
GitHub → Settings → Environments → `production` → secrets `BACKUP_DATABASE_URL` (external URL)
and `BACKUP_GPG_PUBLIC_KEY`. Until both exist the workflow skips with a warning.

Restore from an artifact: download → `gpg -d db-backup.tar.gpg | tar -x` → `verify-backup.sh`.

## Migrating to a new provider

Never `migrate:fresh` on a target meant to receive real data. Migrations are guarded with
`Schema::hasTable` checks and do not exactly reproduce the production schema — **the dump is the source of truth.**

1. Announce a short maintenance window. Optionally put the app in maintenance: set `RUN_MIGRATIONS=false`, suspend the Render service.
2. `scripts/db/backup.sh pre-migration` on the old DB, then `verify-backup.sh`.
3. Create the new DB **on the same or newer PostgreSQL major** (check `server version` from `check.sh`).
4. `export TARGET_DATABASE_URL='<new DB URL>'` → `scripts/db/restore.sh backups/pre-migration-*.dump --confirm <new-db-name>`.
5. `DATABASE_URL=<new> scripts/db/check.sh --counts` — compare with the manifest.
6. Render → Environment → set `DATABASE_URL` to the new **internal** URL (Render) or pooled URL (Neon), `DB_SSLMODE=require`.
7. Deploy (CI or manual hook) → smoke test must pass → resume service.
8. Keep the old DB (read-only) for at least 7 days before deleting it.

## Rules

* No automatic restores, ever. A restore is a human decision (see [disaster-recovery.md](disaster-recovery.md)).
* No seeders in production unless explicitly intended (`db:seed` creates demo users).
* `migrate:fresh`, `migrate:reset`, `db:wipe` are blocked in production by `DB::prohibitDestructiveCommands()`.
* Before any release containing migrations: take and verify a backup.
