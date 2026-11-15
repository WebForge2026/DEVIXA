# DEVIXA — Migration Plan (Supabase → Hetzner Webhosting L)

Date: 2026-11-14 · Phases executed in order; status tracked in `STATUS.md`.

## Strategy in one paragraph

The app already isolates all persistence behind the `AdminStore` interface (`lib/admin/store/types.ts`) with two adapters (Supabase, JSON file). Supabase usage is limited to five PostgreSQL tables — no Supabase Auth, Storage, Realtime or Functions are used, and admin authentication is a self-contained HMAC-cookie system that survives the migration unchanged. We therefore **add a third `AdminStore` adapter backed by Drizzle ORM + `pg` against Hetzner PostgreSQL**, swap the store factory and the lead server actions, ship a clean portable schema with versioned migrations, and replace the deployment pipeline with GitHub Actions → SSH/rsync. The public website, admin UI, animations and SEO are not touched.

## Phase 1 — Audit ✅

Deliverables: `docs/migration/SUPABASE_AUDIT.md`, `docs/migration/DEPENDENCY_MAP.md`, this plan, `STATUS.md`.

Key findings: 5 tables, 0 FKs, 0 functions/triggers, 1 extension (`pgcrypto` — unnecessary on PG ≥ 13), RLS replaceable by server-side authz, `lib/supabase/client.ts` dead code, no Storage usage.

## Phase 2 — PostgreSQL schema + Drizzle layer

- `database/migrations/0001_initial.sql` — portable DDL (all constraints/indexes from `supabase/schema.sql`, no extensions, no RLS/grants, + new `audit_log`, + `_migrations` ledger).
- `database/schema.sql` — full reproducible schema for fresh installs (same DDL).
- `scripts/migrate.mjs` — zero-dependency runner (plain `pg`, runs on the Hetzner box without dev deps): applies pending migrations each in its own transaction, records in `_migrations`, safe to re-run.
- `lib/db/index.ts` — singleton `pg` Pool (max 5, statement timeout, configurable SSL with verification modes), Drizzle instance.
- `lib/db/schema.ts` — Drizzle models mirroring the SQL 1:1.

## Phase 3 — Data migration tooling

- `scripts/export-supabase-data.sh` — `pg_dump --data-only` of the 5 tables from Supabase (env-driven, no secrets in repo/logs; `.migration/` gitignored).
- `scripts/import-hetzner-data.sh` — runs migrations, loads dump, re-sequences `site_events` id.
- `scripts/verify-migration.ts` — compares table/row counts, id sets, timestamps min/max, FK-free integrity spot checks, and runs the app's critical queries (`buildOverview` inputs) against the destination.
- Approval gates: both scripts refuse to run without explicit env confirmation; no destructive ops.

## Phase 4 — Authentication

Keep the existing HMAC-cookie admin session (see audit §7 — no Supabase coupling). Additions: `audit_log` writes on login success/failure, logout, lead patch, content publish (`lib/admin/audit.ts`). No Auth.js, no schema of users, no forced password resets.

## Phase 5 — Replace DB operations

- New adapter `lib/admin/store/db.ts` implementing `AdminStore` with Drizzle (preserving the 100k event limit, upsert heartbeat, `maybeSingle` content read, 2000-lead read cap, status normalization).
- `lib/admin/store/index.ts`: `DATABASE_URL` → db store; else file store (local dev).
- `app/actions/leads.ts`: drop Supabase imports; store-only persistence; behavior preserved (rate limit, honeypot, server-side pricing, `config` result when no persistent store on a serverless host).

## Phase 6 — Admin panel

No UI changes. Only: `AdminShell` warning banner reworded (DATABASE_URL instead of Supabase), `StoreInfo` type gains `'db'`. All admin routes already enforce `requireAdmin()` server-side.

## Phase 7 — Storage

Not used (audit §1). Documented skip; CMS media stay in `site_content.data` (data URLs / https URLs).

## Phase 8 — Website preservation

Zero changes to `[locale]` routes, components, i18n, SEO files, canvas/animation code. Verified via grep + build + typecheck.

## Phase 9 — Hetzner production config

- `.env.example` rewritten (DATABASE_URL, SSL mode, ADMIN_*).
- `server.js` — 12-line konsoleH entry (custom server pattern, honors `$PORT`, keeps `next start` as the standard alternative).
- Node 22 target; local validation on Node 18/whatever is present — Next 14.2 supports both.
- `npm run db:migrate` script.

## Phase 10 — CI/CD

- `.github/workflows/deploy.yml` — CI job (`npm ci`, typecheck, lint, test, build) then deploy job over SSH: `scripts/deploy.sh` creates a timestamped release, rsyncs artifact, repoints `current` symlink, prunes old releases, curls health check. konsoleH restart is a **documented manual step** (no unverified restart workaround). Rollback = repoint symlink to previous release + restart.
- Docs: `docs/DEPLOY_HETZNER.md`, `docs/ROLLBACK.md`.

## Phase 11 — Testing

- `tests/` with `node:test` + `tsx` (no test framework existed before; zero runtime deps added): auth token roundtrip/tamper/expiry, store row↔model mapping incl. status normalization, migration SQL sanity (parses, idempotent markers, schema.sql ≡ migration 0001).
- `npm ci`, `tsc --noEmit`, `npm run lint`, `npm run build` all green.
- Live-DB checks = `scripts/verify-migration.ts` at cutover; marked NOT VERIFIED until run against real Hetzner Postgres.

## Phase 12 — Remove Supabase

- Delete `lib/supabase/`; remove `@supabase/supabase-js`, `@supabase/ssr`; update lockfile; purge env vars; archive `supabase/schema.sql` (header note, kept for audit/rollback per rules); final grep sweep.
- Supabase project itself stays alive until cutover verification — no live resources are touched by this repo work.

## Phase 15 — Cutover & rollback runbook

`docs/migration/RUNBOOK.md`: backup → schema → import → verify → write-freeze window → final sync → env/credential switch → deploy → smoke tests → monitoring → rollback (with divergence handling, not just DNS).

## Decision log

| # | Decision | Rationale |
|---|---|---|
| D1 | Keep custom admin auth, no Auth.js | Not Supabase-based; already meets all requirements; minimal-change rule |
| D2 | Hand-written versioned SQL migrations + `migrate.mjs`, no drizzle-kit push | No special privileges; migrations must run on the shared host with prod deps only; explicit > generated |
| D3 | Plain `mysql2` pool, connectionLimit 5 | Shared-hosting memory; telemetry beacon is the hot path |
| D4 | No `output: 'standalone'` | Task requires standard `npm run build`/`npm run start`; `server.js` wrapper used for konsoleH entry instead |
| D5 | No RLS replacement in SQL | DB reachable only from server; authz enforced in route handlers (already) + CHECK constraints (kept) |
| D6 | `tsx` + `node:test` for tests | No test framework in repo; zero production dependencies added |
| D7 | Legal texts updated to Hetzner wording | GDPR processor identity changes; flagged for lawyer review |
| D8 | **Target database is MariaDB, not PostgreSQL** | Hetzner Webhosting L offers only MySQL/MariaDB via konsoleH — verified with the operator of the hosting. Overrides the original "PostgreSQL → PostgreSQL" assumption; full port executed in Phase 2 rework: `pg`+`drizzle-orm/node-postgres` → `mysql2`+`drizzle-orm/mysql2`, DDL rewritten (uuid→varchar(36)/UUID(), timestamptz→datetime(3) UTC, jsonb→json, bigserial→auto_increment, InnoDB). Data transfer can no longer use `pg_dump` (dialect mismatch) → `scripts/migrate-data.ts` copies Supabase PG → MariaDB over the wire with built-in verification. Constraints MariaDB cannot express (email regex, jsonb checks) are enforced by the existing Zod layer. `pg` is kept as a dev-only dependency of the one-time migration/verify scripts (Supabase source). |
| D9 | **Backend rewritten from Next.js to PHP (user requirement)** | The hosting must keep PHP apps active on the domain; activating Node.js in konsoleH would deactivate them. The frontend keeps 100 % of its technologies (React 18, Three.js/R3F/Rapier, GSAP, Lenis, Tailwind) and is built as a **static export** served by Apache; the entire server layer (6 API routes, server actions, middleware locale redirects, admin auth, DB access) was ported to **PHP 8.1+** (`php/`) with byte-for-byte behavioral parity enforced by cross-language tests (45/45). Consequences, all mitigated: OG images are a single pre-rendered static card (`public/og.png`, identical design for every route, as before); CMS **theme + media apply at runtime** (CmsRuntime), CMS **texts apply at rebuild** (workflow `rebuild-cms.yml` pulls the published state and redeploys); rate limiting moved to a DB table (`_rate_limits`); admin *data* stays server-protected (401), the admin HTML shell is a static file whose gate is the same client redirect the SPA always had; localized 404s are served via Apache `ErrorDocument` to the generated `de/404.html`. No Node.js, no konsoleH Node.js activation, no PM2/systemd — runs on any ordinary Apache+PHP shared host. Drizzle ORM and the mysql2 runtime dependency were removed; `mysql2`+`pg` remain dev-only for the one-time data scripts. |
| D10 | **Frontend is a plain React SPA (Vite) building to `dist/`** | The user's required workflow: `npm run build` → copy only `dist/` to any shared host; PHP + MariaDB handle data/auth. Next.js was fully removed: routing via react-router-dom (same URLs), `next/font` → self-hosted fontsource variable fonts, metadata API → a runtime `<Seo>` manager (canonical/hreflang/OG identical), `next/script` → dynamic script injection, sitemap/robots/manifest generated by `scripts/prebuild.mjs`, locale redirects live in `src` (dev) and `locale.php` (prod, unchanged). All sections/canvas/admin UI components are untouched. Chunk sizes preserved via React.lazy for the WebGL scene and lanyard. Consequence: HTML is client-rendered (Googlebot executes JS; per-page meta/hreflang still set before paint), which is the standard trade of the SPA model the user chose. |
