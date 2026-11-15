/**
 * Company and legal master data, used by the imprint and privacy policy in all languages.
 * Fill in every `null` value before going live. Until then the pages show a highlighted
 * placeholder, so missing data is impossible to overlook.
 */
export const legal = {
  company: 'Creative Solutions 88 EOOD',
  companyBg: '„Криейтив Солюшънс 88“ ЕООД',
  /** Street, postal code and city of the registered office, e.g. "ul. Example 1, 1000 Sofia". */
  address: null as string | null,
  /** Managing director (управител). */
  managingDirector: null as string | null,
  /** Unified identification code (ЕИК / UIC) from the Bulgarian Commercial Register. */
  uic: null as string | null,
  /** VAT identification number, usually "BG" + ЕИК. */
  vatId: null as string | null,
  /** Hosting provider of the website, e.g. "Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland". */
  hostingProvider: 'Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland',
  /** Datacentre location of the managed database (Hetzner, Germany). */
  databaseRegion: 'Deutschland (Hetzner Online GmbH)',
  emails: { office: 'office@devixa.de', support: 'support@devixa.de' },
  phones: { de: '+49 151 29569444', bg: '+359 895 780 379' },
  updated: '2026-11-14',
} as const;

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updatedLabel: string; sections: LegalSection[] };
export type LegalDocs = { imprint: LegalDoc; privacy: LegalDoc };

/** Returns the value, or a bracketed placeholder that the legal page highlights. */
export const fill = (value: string | null, placeholder: string) => value ?? `[${placeholder}]`;
