# DEVIXA — web platform

Marketing site and lead pipeline for **Devixa** (Creative Solutions 88 EOOD).
Frontend: **React 18 SPA (Vite)** · Tailwind · React Three Fiber + Rapier · Lenis + GSAP — build → `dist/`.
Backend: **PHP 8** (any Apache shared host) · MariaDB. No Node.js required on the server.

## Workflow

```bash
npm install
npm run dev      # dev server (проксира /api към PHP бекенда — виж по-долу)
npm run build    # → dist/  — качваш САМО съдържанието на dist/ на хоста
npm test         # unit + TS↔PHP parity тестове (нужен php-cli)
```

Качване на продукция: копираш **съдържанието на `dist/`** в `public_html/devixa.de/`
(през WebFTP/FTP — направо върху съществуващите файлове). PHP бекендът (`api/`,
`.htaccess`, `locale.php`, `~/devixa-php/`, `~/.devixa.php`) се настройва **веднъж**
и не се пипа при ъпдейти на фронта. Ако го няма още — виж `docs/DEPLOY_HETZNER.md`.

Локално API тестване (PHP + реалната база):

```bash
mkdir -p /tmp/devixa-docroot && cp -r php/api /tmp/devixa-docroot/api \
  && cp php/deploy/locale.php /tmp/devixa-docroot/
DEVIXA_LIB="$PWD/php/lib" DEVIXA_CONFIG="$HOME/.devixa.php" php -S 127.0.0.1:8099 -t /tmp/devixa-docroot
# после: npm run dev  →  vite проксира /api към 127.0.0.1:8099
```

## Структура

```
src/                      React SPA вход (main/App/Site/страници/SEO)
components/               всички секции, canvas, providers, admin UI (без промяна)
lib/                      i18n речници, ценообразуване, типове
php/api php/lib           PHP бекенд (ендпойнти + библиотека)
php/deploy/               .htaccess, locale.php, примерен конфиг
database/                 схема, миграции, migrate.php, export-cms.php
scripts/prebuild.mjs      генерира sitemap.xml / robots.txt / manifest в dist
```

## Structure

```
app/
  [locale]/                 en · de · bg (middleware picks from Accept-Language)
    page.tsx                home: hero → trust → journey → services → work → configurator → insights → contact
    services/[slug]/        web-systems · automation-integration · maintenance-support
    insights/[slug]/        3 articles per language (content in lib/i18n/articles/)
    opengraph-image.tsx     generated social preview card
    imprint/ privacy/
  actions/leads.ts          server actions: submitLead, submitEstimate (zod, honeypot, rate limit, server-side price)
  sitemap.ts robots.ts
components/
  canvas/
    CyberChromeScene.tsx    fixed WebGL layer: camera director, rim lights, physics world
    Chains.tsx              2 chains of rigid links on spherical joints; cursor "pusher" body,
                            pointer-velocity wind, scroll-velocity tension + shake
    SpikeStar.tsx           layered chrome star; drag to spin, click for crimson flare
    Debris.tsx              tumbling keycaps + microchips
    ChromeEnvironment.tsx   procedural studio env that crossfades Act I → Act II (no HDR download)
    Lanyard.tsx             footer badge on rope joints; drag, flick, knock with the cursor
  providers/
    SmoothScroll.tsx        Lenis driven by gsap.ticker; feeds ScrollTrigger
    ActController.tsx       Slate → Obsidian inversion when #journey crosses the viewport
    PointerBridge.tsx       pointer position/velocity → shared motion store
  sections/ ui/
lib/
  i18n/dictionaries/        all copy, typed by lib/i18n/types.ts
  estimate.ts               configurator pricing (shared client/server reference)
  store.ts                  per-frame shared state between DOM and WebGL
  submit.ts                 form → PHP endpoint contract (SubmitState)
php/
  api/                      PHP endpoints (leads, estimate, telemetry, admin, health, CMS)
  lib/                      bootstrap/config, auth (HMAC cookie), store (PDO), overview, pricing, rate limit
  deploy/                   .htaccess, locale.php, config example — live at the docroot
database/
  migrations/               versioned, re-runnable SQL migrations (php database/migrate.php)
  schema.sql                full reproducible schema for fresh installs
  migrate.php export-cms.php  CLI tools (migrations / CMS snapshot for rebuilds)
supabase/schema.sql         ARCHIVED pre-migration PostgreSQL schema (audit/rollback reference only)
```

## SEO & launch

- Every page: title, description, canonical (https://devixa.de/…), hreflang (de/en/bg + x-default),
  Open Graph and Twitter card via `lib/seo.ts` → `pageMetadata()`.
- `/sitemap.xml` (`app/sitemap.ts`, all routes × 3 languages with hreflang), `/robots.txt` (`app/robots.ts`;
  Vercel preview deployments are blocked), `/manifest.webmanifest`, favicon/app icons in `public/`.
- Google Search Console code: `lib/site.ts` → `GOOGLE_SITE_VERIFICATION` (or env var).
- Analytics: `lib/analytics.ts` (env vars); GA4/GTM only load after opt-in in the cookie banner.

## Admin Command Center

- Hidden route **`/admin`** (not linked anywhere, `noindex`, blocked in robots.txt) or shortcut
  **Ctrl/⌘ + Shift + A** (fallback **Alt + Shift + A**) on any public page.
- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars; session = HMAC-signed HttpOnly cookie (12 h),
  5 attempts / 10 min. Local `npm run dev` without env vars: `admin@devixa.de` / `devixa-admin-2026`.
- Modules: Command Center (KPIs, trends, funnel, conversion gauge, 12-week heatmap), Live Analytics,
  Leads & Quotes (CRM with search, filters, status, notes, lead inspector), Content & Media CMS
  (texts per language, project images, design settings with reset).
- Data: PHP backend (`php/`) on MariaDB (needs `~/.devixa.php` + `php database/migrate.php`).
  `npm run admin:seed` writes demo data (add `--db` to seed the database).
- Health probe for deploys/uptime monitors: `GET /api/health` (checks the DB).
- CMS: theme + media apply at runtime (CmsRuntime); text overrides apply at build —
  after editing texts run the `rebuild-cms` GitHub workflow (or redeploy).
- Telemetry is first-party and cookieless (`/api/t`): daily-rotating hash, no IP stored, DNT/GPC respected.

## Before going live

1. Fill in the `null` fields in `lib/legal.ts` (address, managing director, ЕИК, VAT ID).
   Hosting provider and database region are pre-filled for Hetzner — verify them.
   Until then the imprint and privacy policy show red placeholders.
2. Create `~/.devixa.php` on the host (see `php/deploy/devixa.config.example.php`), run
   `php database/migrate.php`, and deploy per `docs/DEPLOY_HETZNER.md`.
3. Have the imprint and privacy policy reviewed by a lawyer.

## Notes

- Languages: German (default), English, Bulgarian. Order: saved choice (`NEXT_LOCALE` cookie) → browser language → German.
- Copy lives in `lib/i18n/dictionaries/*.ts`, articles in `lib/i18n/articles/`, legal texts in `lib/i18n/legal/`. Contacts live in `lib/site.ts`.
- Cost calculator (`lib/estimate.ts`): German agency reference prices × `DEVIXA_FACTOR` (0.7 = 30 % below the German market). The UI shows both.
- Respects `prefers-reduced-motion` (no smooth scroll, no pinning, no physics impulses) and falls back to the CSS atmosphere when WebGL is unavailable.
- Forms are rate-limited to 5 submissions per IP per 10 minutes, per server instance. On multi-instance hosting, use a shared limiter instead.
- The 3D layers sit behind an error boundary: if WebGL fails, the page keeps working.
- The custom cursor only activates on fine pointers; touch devices keep native behaviour.
