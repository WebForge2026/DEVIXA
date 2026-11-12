import type { Locale } from '@/lib/i18n/config';

/* ---------------------------------------------------------------------------
   Shared admin data model (used by API routes, stores and the admin UI)
--------------------------------------------------------------------------- */

export const leadStatuses = ['new', 'contacted', 'proposal', 'won', 'archived'] as const;
export type LeadStatus = (typeof leadStatuses)[number];

/** quote = cost calculator submission, contact = contact form enquiry */
export type LeadKind = 'quote' | 'contact';

export type LeadConfig = { systemType: string; features: string[]; timeline: string };

export type Lead = {
  id: string;
  kind: LeadKind;
  createdAt: string;
  status: LeadStatus;
  notes: string;
  name: string | null;
  email: string;
  company: string | null;
  phone: string | null;
  /** Calculator range in EUR (quotes only). */
  priceLow: number | null;
  priceHigh: number | null;
  /** Budget chosen in the contact form (contact only). */
  budgetLabel: string | null;
  projectType: string | null;
  message: string | null;
  config: LeadConfig | null;
  locale: string | null;
};

export type NewLead = Omit<Lead, 'id' | 'createdAt' | 'status' | 'notes'>;
export type LeadPatch = { status?: LeadStatus; notes?: string };

export const eventTypes = ['pageview', 'calc_view', 'calc_interact'] as const;
export type EventType = (typeof eventTypes)[number];

/** Anonymous, cookieless telemetry event. `visitor` is a daily-rotating hash, never an IP. */
export type TelemetryEvent = { type: EventType; path: string; locale: string; visitor: string; createdAt: string };

export type Presence = { visitor: string; path: string; lastSeen: string };

export type ThemeSettings = {
  /** Brand accent (hex). */
  accent: string;
  /** Card corner radius in px. */
  cardRadius: number;
  /** Spotlight glow strength on cards, 0–0.4. */
  glow: number;
  /** Share of crimson keys on the 3D sphere, 0.05–0.45. */
  sphereRed: number;
};

export const defaultTheme: ThemeSettings = { accent: '#FF2A2A', cardRadius: 0, glow: 0.16, sphereRed: 0.2 };

export type MediaItem = { id: string; slot: string; src: string; alt: string; updatedAt: string };

export type ContentState = {
  /** Text overrides per locale, keyed by dictionary path (e.g. "hero.headline.0"). */
  texts: Partial<Record<Locale, Record<string, string>>>;
  media: MediaItem[];
  theme: ThemeSettings;
  updatedAt: string | null;
};

export const emptyContent = (): ContentState => ({ texts: {}, media: [], theme: { ...defaultTheme }, updatedAt: null });

export type Range = 'today' | '7d' | '30d' | '90d';
export const ranges: Range[] = ['today', '7d', '30d', '90d'];
export const rangeDays: Record<Range, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

export const normalizeStatus = (value: string | null | undefined): LeadStatus => {
  if (value && (leadStatuses as readonly string[]).includes(value)) return value as LeadStatus;
  if (value === 'qualified') return 'proposal';
  if (value === 'lost' || value === 'spam') return 'archived';
  return 'new';
};
