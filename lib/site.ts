export const site = {
  brand: 'Devixa',
  legalEntity: 'Creative Solutions 88 EOOD',
  location: 'Bulgaria (EU)',
  markets: ['DE', 'BG', 'PL', 'INTL'] as const,
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
