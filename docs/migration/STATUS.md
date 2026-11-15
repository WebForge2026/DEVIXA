# DEVIXA — Migration Status

Last updated: 2026-11-14 — **ALL PHASES COMPLETE — PHP backend architecture (D9), verified against the live Hetzner database**

> **D8:** target DB is MariaDB (konsoleH has no PostgreSQL on shared hosting).
> **D9:** the hosting must keep PHP apps active on the domain, so the backend was rewritten
> from Next.js to **PHP 8** (user decision after konsoleH confirmed Node.js activation
> deactivates PHP for the domain). The frontend keeps 100 % of its stack (React 18,
> Three.js/R3F/Rapier, GSAP, Lenis, Tailwind) as a **static export served by Apache**.
> Full rationale and consequences in `docs/migration/MIGRATION_PLAN.md` (decision log).

## Phase tracker

| Phase | Status | Notes |
|---|---|---|
| 1 — Audit | ✅ DONE | `SUPABASE_AUDIT.md`, `DEPENDENCY_MAP.md`, `MIGRATION_PLAN.md` |
| 2 — MariaDB schema | ✅ DONE | `database/migrations/{0001,0002}`, `schema.sql`, `database/migrate.php` (PHP CLI; MySQL DDL implies commits so migrations are idempotent rather than transactional) |
| 3 — Data migration | ✅ DONE (code) / ⏳ NOT VERIFIED (live Supabase) | `scripts/migrate-data.ts` (PG→MariaDB copy + verify), `scripts/verify-migration.ts` |
| 4 — Auth | ✅ DONE | HMAC cookie session **ported to PHP with identical token format** (cross-language verified); `audit_log` writes in login/logout/lead-update/publish |
| 5 — Backend replacement | ✅ DONE (D9) | All 6 API routes + server actions + middleware redirects ported to `php/`; rate limiting DB-backed (`_rate_limits`) |
| 6 — Admin panel | ✅ DONE | UI 100 % unchanged (same fetch URLs via .htaccess rewrites); 401-gate identical |
| 7 — Storage | ✅ SKIPPED (documented) | Supabase Storage never used |
| 8 — Website preservation | ✅ DONE | Zero visual changes: only form submit plumbing, `data-cms-slot` attrs, CmsRuntime provider, OG image now a pre-rendered static card (identical design) |
| 9 — Hetzner config | ✅ DONE | Static export + PHP; **no Node.js/konsoleH Node activation needed**; `~/.devixa.php` secrets outside webroot; `/api/health` |
| 10 — CI/CD | ✅ DONE (code) / ⏳ NOT VERIFIED (live) | `deploy.yml` (build export → scp → deploy.sh → health check), `rebuild-cms.yml` (text overrides → rebuild) |
| 11 — Testing | ✅ DONE | see table below — SPA build: tsc/lint/45 tests/Vite build (dist) green; PHP smoke vs live DB green |
| 12 — Remove Supabase | ✅ DONE | packages/clients/env removed; legal texts updated; grep clean |
| 15 — Cutover runbook | ✅ DONE | `docs/migration/RUNBOOK.md`, `docs/ROLLBACK.md` |

## Test results (executed)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (0 warnings) |
| `npm test` (node:test + tsx + php-cli) | **45/45 PASS** — auth tokens, migrations/schema parity, and cross-language parity: estimate pricing, `buildOverview` byte-for-byte on a 250-event fixture, `normalizeStatus`, and HMAC session tokens both directions (TS↔PHP) |
| `php -l` on all PHP files | PASS |
| `next build` (static export) | PASS — 41 pages: 3 locales × (home, 3 services, 3 insights, imprint, privacy, 404), admin panel (5 pages), sitemap.xml, robots.txt, manifest |
| **LIVE PHP smoke vs Hetzner MariaDB 11.8** | PASS — health db=up; telemetry insert; session probe; login (wrong pw 401 path / correct 200 + cookie); overview aggregation; lead insert (server-side price 11500–20000 exactly matching the TS reference); estimate insert with `features[]`; lead PATCH; content GET/PUT; public CMS feed; audit_log entries; anonymous admin API → 401 |
| Migration runner vs live DB | PASS — 0001 skip (applied), 0002 applied + rerun skips |
| Cleanup | all smoke rows removed; DB empty except `_migrations` |

## Known differences vs. the old Node backend (all decided in D9)

1. CMS text overrides apply at build/deploy — use the `rebuild-cms` workflow after editing texts. Theme + media are instant (runtime).
2. OG/Twitter image is one static card (`/og.png`) — the old dynamic route rendered an identical card on every page anyway.
3. Localized 404s come from Apache `ErrorDocument` → `de/404.html` (German default, as x-default).
4. Admin HTML shell is a static file; data protection is unchanged (every admin API verifies the session server-side → 401).

## NOT VERIFIED (requires user action / live infra)

- First real deploy through GitHub Actions (needs the HETZNER_* secrets).
- Live data copy from Supabase (`migrate-data.ts`) — awaiting Supabase DSN + approval.
- Apache `.htaccess` behavior on konsoleH (rules are standard; verified by inspection + local PHP behavior; confirm after first deploy).
- Lawyer review of updated privacy texts.

## Layout

- Frontend (unchanged technologies): `app/`, `components/`, `lib/` (i18n, estimate, seo, telemetry oracle, submit)
- PHP backend: `php/api/*`, `php/lib/*`, `php/deploy/*`
- DB: `database/` (schema, migrations, migrate.php, export-cms.php)
- Scripts: `scripts/deploy.sh`, `scripts/migrate-data.ts`, `scripts/verify-migration.ts`, `scripts/generate-fixture.mjs`, `scripts/admin-seed.mjs`
- CI: `.github/workflows/deploy.yml`, `.github/workflows/rebuild-cms.yml`
- Docs: `docs/DEPLOY_HETZNER.md`, `docs/ROLLBACK.md`, `docs/migration/*`
