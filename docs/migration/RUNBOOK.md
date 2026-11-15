# DEVIXA — Production Cutover Runbook (Supabase → Hetzner)

**Every destructive/production step requires explicit approval. Supabase stays fully
operational until step 9 is verified. Nothing in the Supabase project is deleted by
these procedures.**

## 0. Prerequisites

- [ ] Hetzner Webhosting L with Node.js 22 + PostgreSQL provisioned (konsoleH).
- [ ] Server setup per `docs/DEPLOY_HETZNER.md` (env vars, SSH key, `~/devixa/.env`).
- [ ] CI deploy workflow green on the migration branch.
- [ ] `postgresql-client` tools available where scripts run (`pg_dump`, `psql`).
- [ ] Legal texts updated & reviewed (Hetzner named as processor — see Phase 12 notes).

## 1. Pre-migration backup

```bash
# Supabase side (full PostgreSQL dump) — keep until the verification period ends.
# Requires postgresql-client (pg_dump) locally:
SUPABASE_DB_URL='postgres://…' pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges \
  -f .migration/supabase-full-pre-migration-$(date +%F).sql
```
`.migration/` is gitignored. Store backups encrypted/off-site. (There is nothing
to back up on the Hetzner side yet — fresh database.)

## 2. Schema migration (Hetzner MariaDB)

```bash
DATABASE_URL='mysql://…' npm run db:migrate
# Expected: apply 0001_initial.sql → ok (requires MariaDB ≥ 10.2)
```

## 3. Initial data import (Supabase PostgreSQL → MariaDB)

`pg_dump` output cannot be replayed into MariaDB, so the copy runs over the wire:

```bash
SUPABASE_DB_URL='postgres://…' DATABASE_URL='mysql://…' \
MIGRATE_DATA_CONFIRM=yes npx tsx scripts/migrate-data.ts
```

Copies all five tables preserving ids, timestamps and JSON, then verifies counts,
id sets and timestamp ranges. Run once against an empty target.

## 4. Validation

```bash
SUPABASE_DB_URL='postgres://…' DATABASE_URL='mysql://…' npx tsx scripts/verify-migration.ts
```
All checks must PASS. Investigate any FAIL before continuing.

## 5. Write-freeze strategy (short window)

The site has no user accounts; public writes = leads, estimates, telemetry.
Choose a low-traffic window and deploy a temporary banner/maintenance state, **or**
accept a small delta and re-run the delta sync (step 6) — telemetry rows are
append-only and duplicate-safe for counting if the cutover window is minutes.

## 6. Final data synchronization

Re-run steps 3–4 **without re-creating the schema** to pick up rows written since
step 3. The import is wrapped in a transaction per table batch; for a true delta use
`--where`-style filters on `created_at`, e.g. export with
`pg_dump … --where="created_at > '<freeze-start>'"` per table, or simply re-export
full and import into a fresh scratch DB, verify, then swap `DATABASE_URL` (safest).

## 7. Authentication cutover

None needed for admin credentials — the HMAC session system is unchanged
(`ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` are set in konsoleH).
Existing admin cookies remain valid across the cutover (same secret ⇒ same tokens).
Supabase Auth was never used; no user passwords exist to migrate.

## 8. Application deployment

1. Merge the migration branch → `main` → GitHub Actions builds the static export,
   uploads and activates it (`docs/DEPLOY_HETZNER.md`).
2. Nothing to restart — Apache + PHP serve every request; deployments only flip
   the `current` symlinks. The konsoleH **Node.js panel is not used at all**, so the
   PHP applications on the domain stay active.
3. Health: `curl -fsS https://devixa.de/api/health` → `{"ok":true,"db":"up","store":"db"}`.

## 9. Smoke tests

- [ ] `/de`, `/en`, `/bg` render; language switch works.
- [ ] Submit a **test lead** on the contact form → visible in `/admin` CRM.
- [ ] Submit a **test calculator quote** → appears with server-computed price.
- [ ] `/admin` login/logout; dashboard KPIs, charts, live view populate.
- [ ] CMS text edit → publish → visible on public page.
- [ ] Telemetry: pageviews appear in Live Analytics.
- [ ] SEO spot-check: `/robots.txt`, `/sitemap.xml`, hreflang unchanged.
- [ ] Delete/disable the test lead; check `audit_log` recorded the actions.

## 10. DNS / domain

No change: the app stays on `devixa.de` at Hetzner; only the backend moved.
TLS certificate management stays with the hosting panel.

## 11. Monitoring

- Uptime monitor on `/api/health` (checks DB too).
- Weekly: `scripts/verify-migration.ts`-style row-count spot check vs. expectations.
- Housekeeping SQL from `database/README.md` (optional cron).

## 12. Rollback

See `docs/ROLLBACK.md` (app symlink flip + DB restore + **divergence handling**:
export Hetzner-written rows back to Supabase — DNS alone is not a rollback).

## 13. Post-verification cleanup (only after a stable period)

- [ ] Remove Supabase env vars from any remaining systems.
- [ ] Pause/keep Supabase project per data-retention policy, then delete.
- [ ] Archive `.migration/` dumps per GDPR retention rules (leads contain personal data).
