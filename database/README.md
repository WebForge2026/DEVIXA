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
