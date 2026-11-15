# DEVIXA — Dependency Map (Supabase → Hetzner)

Date: 2026-11-14 · Status legend: **MIGRATE** = re-implement against Hetzner Postgres · **REPLACE** = swap for another mechanism · **KEEP-TMP** = may remain during transition · **REMOVE** = unused.

## Runtime dependencies (package.json)

| Package | Role today | Verdict |
|---|---|---|
| `next` 14.2.35 | Framework | KEEP (Rule 4 — no upgrade) |
| `react` / `react-dom` 18.3.1 | UI | KEEP |
| `typescript` 5.9.3 | Types | KEEP |
| `zod` 4.6.7 | Validation (forms, admin API) | KEEP |
| `tailwindcss` 3 + `postcss` + `autoprefixer` | Styles | KEEP |
| `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/rapier` | WebGL scene | KEEP |
| `gsap` + `lenis` | Animation / smooth scroll | KEEP |
| `lucide-react`, `clsx`, `tailwind-merge` | UI helpers | KEEP |
| `recharts` 2.15.4 | Admin charts | KEEP |
| `server-only` | Server/client boundary guard | KEEP |
| `@supabase/supabase-js` 2.119.0 | Service-role DB client | **REMOVE** (Phase 12) |
| `@supabase/ssr` 0.12.7 | Browser/anon server client | **REMOVE** (Phase 12) |
| `drizzle-orm` *(new)* | Type-safe DB access (mysql2 driver) | ADD |
| `mysql2` *(new)* | MariaDB driver (Hetzner Webhosting L database) | ADD |
| `pg` *(kept)* | PostgreSQL driver — dev-only, for the one-time Supabase source in `scripts/migrate-data.ts` / `verify-migration.ts` | KEEP (scripts) |

Dev-only additions: `tsx` (runs `node --test` suites against TS sources), `@types/pg` (types for the migration scripts). No other dev-deps change.

## Environment variables

| Variable | Before | After |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | **REMOVE** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (RLS insert) | **REMOVE** |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | **REMOVE** |
| `DATABASE_URL` | — | **ADD** (server-only MariaDB DSN, `mysql://…`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Custom admin auth | KEEP — unchanged |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_ANALYTICS_*` | SEO / analytics | KEEP |

No `AUTH_SECRET` / `AUTH_URL`: Auth.js was evaluated and rejected (see SUPABASE_AUDIT.md §7) — the existing env-based admin session stays.

## Code-level dependency graph

```
middleware.ts ──► lib/admin/auth.ts (HMAC cookie)          [no Supabase — untouched]
app/api/admin/* ──► lib/admin/session.ts ──► lib/admin/auth.ts
app/api/admin/* ──► lib/admin/store/index.ts ──► AdminStore
                                                    ├─ createSupabaseStore()  → REPLACED by createDbStore()
                                                    └─ createFileStore()      → local dev fallback
app/api/t/route.ts ──► getStore()
app/actions/leads.ts ──► getStore() (+ anon Supabase fallback → REMOVED)
lib/admin/content.ts ──► getStore() (+ unstable_cache CMS_TAG)
lib/admin/telemetry.ts ──► pure functions                 [untouched]
app/admin/**, components/admin/** ──► fetch /api/admin/*  [untouched UI]
```

## Database tables → Drizzle schema (`lib/db/schema.ts`, mysql-core)

| Table (MariaDB) | Drizzle model | Notes |
|---|---|---|
| `leads` | `leads` | `id` varchar(36) ← Supabase uuid, CHECKs preserved |
| `project_estimates` | `projectEstimates` | `features` json `$type<string[]>` |
| `site_events` | `siteEvents` | `bigint auto_increment` ← bigserial |
| `site_presence` | `sitePresence` | PK `visitor`, INSERT … ON DUPLICATE KEY UPDATE |
| `site_content` | `siteContent` | `data` json `$type<ContentState>` |
| `audit_log` *(new)* | `auditLog` | Admin audit trail (login/logout/lead patch/content publish) |

`_migrations` ledger managed by `scripts/migrate.mjs` (not in Drizzle schema).

> **D8 (2026-11-14, infrastructure constraint):** target DB is **MariaDB**, not
> PostgreSQL — Hetzner Webhosting L offers only MySQL/MariaDB. Driver `pg` →
> `mysql2`, Drizzle `node-postgres` → `mysql2`, DDL rewritten for MariaDB ≥ 10.2
> (InnoDB, UUID(), datetime(3) UTC, json). Constraints MariaDB cannot express
> (email regex, jsonb shape) are enforced by the existing Zod layer. Data
> transfer: `scripts/migrate-data.ts` (pg_dump cannot cross dialects). `pg`
> remains only as a dependency of the one-time migration scripts.

## Supabase-specific SQL → replacement

| Supabase artifact | Replacement |
|---|---|
| `auth.uid()`, `auth.users`, `auth.role()`, `auth.jwt()` | never used — n/a |
| RLS policies + anon/service_role grants | Server-side authorization: `requireAdmin()` on all admin routes, Zod-validated Server Actions for public inserts, DB reachable only from server (`DATABASE_URL` never leaves the server) |
| `create extension pgcrypto` | removed — Supabase/PostgreSQL source only. MariaDB has `UUID()` built in; no extensions exist on shared hosting |
| `service_role` key | Hetzner DB user credentials in `DATABASE_URL` |
| `pg_cron` housekeeping comment | Documented as optional cron in `database/README.md` |

## External services

- **Vercel** (referenced in code as `process.env.VERCEL` file-store guard) — becomes irrelevant on Hetzner; guard kept so local dev still works anywhere.
- **Plausible / GA4 / GTM** — env-driven, untouched.
- **No e-mail service** exists in the app (no transactional mail), so no SMTP dependency is introduced.

## What stays 100% untouched

Website UI, all `[locale]` routes, Three.js/Rapier scene, GSAP/Lenis, SEO (sitemap, robots, hreflang, OG), admin panel design, Recharts dashboards, telemetry aggregation math, rate limiters, i18n dictionaries.
