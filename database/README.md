# DEVIXA database (Hetzner MariaDB)

Hetzner Webhosting L provides **MariaDB** via konsoleH (no PostgreSQL on shared
hosting). Plain DDL, no extensions, no special privileges, single pre-created
database. This directory replaces `supabase/schema.sql` (archived for audit only).

## Type mapping vs. the archived Supabase/PostgreSQL schema

| PostgreSQL (Supabase) | MariaDB | Notes |
|---|---|---|
| `uuid` / `gen_random_uuid()` | `varchar(36)` / `UUID()` | Existing ids copy across unchanged |
| `timestamptz` | `datetime(3)` | App stores/reads UTC exclusively (`dateStrings`, mappers in `lib/admin/store/mappers.ts`) — TZ-independent |
| `jsonb` | `json` | MariaDB JSON = LONGTEXT + validation |
| `bigserial` | `bigint auto_increment` | |

Constraints MariaDB **cannot** enforce (e-mail regex via `~*`, `jsonb_typeof`,
`jsonb_array_length`) are covered by the Zod schemas on every write path
(`app/actions/leads.ts`, `app/api/admin/content/route.ts`). All other CHECK
constraints and indexes are preserved verbatim.

## Layout

- `schema.sql` — full reproducible schema for a **fresh** database.
- `migrations/` — versioned, re-runnable SQL migrations (authoritative path;
  `0001_initial.sql` + `0002_rate_limits.sql` are DDL-equivalent to `schema.sql` — a test enforces this).
- `../scripts/migrate.mjs` — runner (plain `mysql2`, zero dev deps, safe on the
  Hetzner box). Creates `_migrations(name, applied_at)`, applies pending files in
  transactions, records success. Re-running is a no-op.
- `../scripts/migrate-data.ts` — one-time copy Supabase PostgreSQL → this database
  (ids, timestamps, JSON preserved; batch-verified).
- `../scripts/verify-migration.ts` — independent re-verification any time later.

## Tables

| Table | Purpose | Notes |
|---|---|---|
| `leads` | Contact-form enquiries | CRM `status` values `qualified`/`lost`/`spam` kept, normalized in the app layer |
| `project_estimates` | Calculator quotes | `features` json array (≤ 20 items enforced by Zod) |
| `site_events` | Cookieless telemetry | Retain ~13 months (SQL below) |
| `site_presence` | Live-visitor heartbeats | Rows deletable once stale |
| `site_content` | CMS state, one row `id='live'` | Media are data/https URLs inside the json — no file storage |
| `audit_log` | Admin audit trail | Best-effort writes; never blocks a request |

No foreign keys exist by design (app-level union of `leads` + `project_estimates`).

## Running migrations

```bash
DATABASE_URL=mysql://user:pass@host:3306/dbname npm run db:migrate
```

## Housekeeping (optional cron on Hetzner)

```sql
delete from site_events where created_at < utc_timestamp() - interval 13 month;
delete from site_presence where last_seen < utc_timestamp() - interval 1 day;
```

### Admin users

Run `php database/migrate.php` and then, **before deploying the new authentication code**, run `DEVIXA_CONFIG=/path/to/config.php php database/import-admin.php`. This imports the configured `admin_email` and `admin_password` as a password hash only when there are no admin users. Back up the database first. Deploy the new PHP and frontend together, sign in with the existing credentials, then remove `admin_email` and `admin_password` from the config. Keep `admin_session_secret`: it signs sessions. Existing sessions must sign in again. Further administrators are managed under Admin → Users; all have full access. Password changes and account removal invalidate that user's sessions.

### Run migrations over HTTPS

After deploying the PHP API and `_devixa/database` files, optionally set a separate, random `migration_key` (at least 32 characters) in `_devixa/config.php`. For example, generate one with `openssl rand -hex 32`. Keep it private; an empty or missing key disables the endpoint. From a terminal, run:

```bash
read -rs -p "Migration key: " DEVIXA_MIGRATION_KEY; echo
curl --fail-with-body -X POST https://devixa.de/api/migrate.php \
  -H "Authorization: Bearer $DEVIXA_MIGRATION_KEY"
unset DEVIXA_MIGRATION_KEY
```

The JSON response lists applied and skipped migrations. Only run this over HTTPS. The key is sent in a header, not in the URL. Remove the key from the config when remote migration access is no longer needed. The endpoint runs SQL migrations only; the initial administrator import described above remains a separate CLI step.

### GitHub Actions deployment

The `deploy` workflow invokes `scripts/deploy.sh` over SSH. If `_devixa/config.php` exists, the script runs the release migrations using that config before copying the application files. A failed migration fails the deployment; already applied migrations are skipped. If the config is missing, migrations are skipped with a warning. This uses SSH and does not require the optional HTTP migration endpoint or `migration_key`. Initial admin import remains a separate one-time step.
