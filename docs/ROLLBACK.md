# DEVIXA — Rollback (Hetzner Webhosting L)

## Application rollback (bad release)

Releases are immutable directories; rollback is a symlink flip:

```bash
ssh <user>@<host>
cd ~/devixa
ls -1t releases/                          # newest first
ln -sfn ~/devixa/releases/<good-release> current.new && mv -T current.new current
# REQUIRED MANUAL STEP: restart the app in konsoleH (Settings → Node.js → Restart)
curl -fsS https://devixa.de/api/health
```

Notes:
- `shared/node_modules` is lockfile-versioned; a rollback to a release with a different
  lockfile hash re-triggers `npm ci` on the *next* deploy, not during rollback. If the
  rollback target needs different deps **right now**, run:
  `cd ~/devixa/shared && npm ci --omit=dev` (after copying that release's lockfile).
- The database is **not** rolled back by this procedure (see below).

## Database rollback

Migrations are forward-only and non-destructive by design (no `DROP COLUMN`/`DELETE`
in 0001). A full DB restore = restore the pre-migration backup taken in the runbook:

```bash
# backup was created before import, e.g.:
# pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup-pre-migration.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f backup-pre-migration.sql
```

## DNS rollback is NOT sufficient

The application and the database moved together. Rolling back only DNS leaves writes
diverging between Supabase (old) and Hetzner (new). See the divergence procedure in
`docs/migration/RUNBOOK.md` §Rollback.

## Cutover rollback (Supabase still authoritative)

If verification after cutover fails and Supabase was kept intact (default per runbook):

1. Revert env/config so the previous deployment talks to Supabase again
   (re-add the old deployment release via symlink flip if it still exists, or redeploy
   the last Supabase-based commit).
2. DNS/domain unchanged (same host) — nothing to do there.
3. Export any leads/events written to Hetzner during the failed window and import them
   into Supabase manually (`scripts/export-supabase-data.sh` pattern, reversed DSNs).
4. Only delete Supabase resources after a stable verification period.
