# DEVIXA — web platform

Marketing site and lead pipeline for **Devixa** (Creative Solutions 88 EOOD).
Next.js 14 App Router · TypeScript · Tailwind · React Three Fiber + Rapier · Lenis + GSAP · Supabase.

## Run

```bash
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev                  # http://localhost:3000 → /de (or the saved / browser language)
npm run build && npm start
```

Supabase: create a project in an **EU region**, then run `supabase/schema.sql` in the SQL editor.
Without the env vars the site still works; the forms show a "not connected yet" message.

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
  estimate.ts               configurator pricing (shared client/server)
  store.ts                  per-frame shared state between DOM and WebGL
  supabase/                 browser + server clients (@supabase/ssr)
supabase/schema.sql         tables, constraints, RLS: anon INSERT only, reads for service_role
```

## SEO & launch

- Every page: title, description, canonical (https://devixa.de/…), hreflang (de/en/bg + x-default),
  Open Graph and Twitter card via `lib/seo.ts` → `pageMetadata()`.
- `/sitemap.xml` (`app/sitemap.ts`, all routes × 3 languages with hreflang), `/robots.txt` (`app/robots.ts`;
  Vercel preview deployments are blocked), `/manifest.webmanifest`, favicon/app icons in `public/`.
- Google Search Console code: `lib/site.ts` → `GOOGLE_SITE_VERIFICATION` (or env var).
- Analytics: `lib/analytics.ts` (env vars); GA4/GTM only load after opt-in in the cookie banner.

## Before going live

1. Fill in the `null` fields in `lib/legal.ts` (address, managing director, ЕИК, VAT ID, hosting provider).
   Until then the imprint and privacy policy show red placeholders.
2. Add the Supabase keys and run `supabase/schema.sql`.
3. Have the imprint and privacy policy reviewed by a lawyer.

## Notes

- Languages: German (default), English, Bulgarian. Order: saved choice (`NEXT_LOCALE` cookie) → browser language → German.
- Copy lives in `lib/i18n/dictionaries/*.ts`, articles in `lib/i18n/articles/`, legal texts in `lib/i18n/legal/`. Contacts live in `lib/site.ts`.
- Cost calculator (`lib/estimate.ts`): German agency reference prices × `DEVIXA_FACTOR` (0.7 = 30 % below the German market). The UI shows both.
- Respects `prefers-reduced-motion` (no smooth scroll, no pinning, no physics impulses) and falls back to the CSS atmosphere when WebGL is unavailable.
- Forms are rate-limited to 5 submissions per IP per 10 minutes, per server instance. On multi-instance hosting, use a shared limiter instead.
- The 3D layers sit behind an error boundary: if WebGL fails, the page keeps working.
- The custom cursor only activates on fine pointers; touch devices keep native behaviour.
