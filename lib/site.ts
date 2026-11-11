export const site = {
  brand: 'Devixa',
  legalEntity: 'Creative Solutions 88 EOOD',
  location: 'Bulgaria (EU)',
  markets: ['DE', 'BG', 'PL', 'INTL'] as const,
  /** Canonical origin for canonical URLs, hreflang, sitemap and Open Graph. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devixa.de',
  contact: {
    support: 'support@devixa.de',
    office: 'office@devixa.de',
    phoneDE: { display: '+49 151 29569444', href: 'tel:+4915129569444' },
    phoneBG: { display: '+359 895 780 379', href: 'tel:+359895780379' },
  },
} as const;

export const serviceSlugs = ['web-systems', 'automation-integration', 'maintenance-support'] as const;
export type ServiceSlug = (typeof serviceSlugs)[number];

export const isServiceSlug = (value: string): value is ServiceSlug =>
  (serviceSlugs as readonly string[]).includes(value);

/* ===========================================================================
   GOOGLE SEARCH CONSOLE — Verifizierung
   ---------------------------------------------------------------------------
   HIER_CODE_EINFUEGEN: Den Wert aus content="…" des Meta-Tags
   <meta name="google-site-verification" content="…" /> aus der Search Console
   zwischen die Anführungszeichen setzen, z. B. 'AbC123xyz…'.
   Alternativ als Umgebungsvariable NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION bei Vercel.
   Solange der Wert leer ist, wird kein (ungültiges) Tag ausgegeben.
   =========================================================================== */
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '';
