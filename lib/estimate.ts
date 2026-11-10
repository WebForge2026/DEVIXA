/**
 * Indicative pricing model for the system configurator.
 * Shared by the client (live preview) and the server action (authoritative recalculation),
 * so a tampered client can never persist a price it did not earn.
 * Figures are in EUR and are deliberately coarse — the binding number is the written quote.
 */
export const systemTypes = ['website', 'webshop', 'business-system', 'integration'] as const;
export const featureIds = ['multilang', 'cms', 'booking', 'payments', 'portal', 'dashboard', 'api', 'ai', 'migration'] as const;
export const timelineIds = ['flexible', 'standard', 'priority'] as const;

export type SystemType = (typeof systemTypes)[number];
export type FeatureId = (typeof featureIds)[number];
export type TimelineId = (typeof timelineIds)[number];

const baseRange: Record<SystemType, [number, number]> = {
  website: [3500, 7000],
  webshop: [8000, 16000],
  'business-system': [15000, 35000],
  integration: [6000, 14000],
};

const featureCost: Record<FeatureId, number> = {
  multilang: 1200,
  cms: 1500,
  booking: 4500,
  payments: 2500,
  portal: 5000,
  dashboard: 3500,
  api: 3000,
  ai: 4500,
  migration: 2000,
};

const timelineFactor: Record<TimelineId, number> = { flexible: 0.92, standard: 1, priority: 1.2 };

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export const estimateRange = (system: SystemType, features: readonly FeatureId[], timeline: TimelineId) => {
  const [baseLow, baseHigh] = baseRange[system];
  const extras = features.reduce((sum, id) => sum + featureCost[id], 0);
  const factor = timelineFactor[timeline];
  return {
    low: roundTo((baseLow + extras * 0.85) * factor, 500),
    high: roundTo((baseHigh + extras * 1.15) * factor, 500),
  };
};

export const formatEuro = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
