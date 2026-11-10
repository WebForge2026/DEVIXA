# DEVIXA — web platform

Marketing site and lead pipeline for **Devixa** (Creative Solutions 88 EOOD).
Next.js 14 App Router · TypeScript · Tailwind · React Three Fiber + Rapier · Lenis + GSAP · Supabase.

## Run

```bash
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev                  # http://localhost:3000 → redirects to /en, /de or /bg
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

## Notes

- Copy lives in `lib/i18n/dictionaries/*.ts`. Contacts live in `lib/site.ts`.
- Configurator ranges in `lib/estimate.ts` are placeholders. Set them to your real rates.
- Respects `prefers-reduced-motion` (no smooth scroll, no pinning, no physics impulses) and falls back to the CSS atmosphere when WebGL is unavailable.
- Forms are rate-limited to 5 submissions per IP per 10 minutes, per server instance. On multi-instance hosting, use a shared limiter instead.
- The 3D layers sit behind an error boundary: if WebGL fails, the page keeps working.
- The custom cursor only activates on fine pointers; touch devices keep native behaviour.
