/**
 * Pricing model for the cost calculator.
 *
 * Reference values are typical German agency prices (net, EUR). Devixa quotes
 * DEVIXA_FACTOR (= 30 % below) that reference. Shared by the client (live preview)
 * and the server action (authoritative recalculation), so a tampered client can
 * never persist a price it did not earn. The binding number is always the written quote.
 */
export const systemTypes = ['website', 'webshop', 'business-system', 'integration'] as const;
export const featureIds = ['multilang', 'cms', 'booking', 'payments', 'portal', 'dashboard', 'api', 'ai', 'migration'] as const;
export const timelineIds = ['flexible', 'standard', 'priority'] as const;

export type SystemType = (typeof systemTypes)[number];
export type FeatureId = (typeof featureIds)[number];
export type TimelineId = (typeof timelineIds)[number];

/** Devixa prices sit 30 % below the German market reference. */
export const DEVIXA_FACTOR = 0.7;

/** German market reference: base project range per system type (net EUR). */
const germanBaseRange: Record<SystemType, [number, number]> = {
  website: [5000, 12000],
  webshop: [12000, 30000],
  'business-system': [25000, 70000],
  integration: [8000, 25000],
};

/** German market reference: typical add-on cost per component (net EUR). */
const germanFeatureCost: Record<FeatureId, number> = {
  multilang: 2000,
  cms: 2500,
  booking: 7000,
  payments: 3500,
  portal: 9000,
  dashboard: 6000,
  api: 5000,
  ai: 8000,
  migration: 3500,
};

const timelineFactor: Record<TimelineId, number> = { flexible: 0.92, standard: 1, priority: 1.2 };

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

const devixaRange = (system: SystemType, features: readonly FeatureId[], timeline: TimelineId, factor: number) => {
  const [baseLow, baseHigh] = germanBaseRange[system];
  const extras = features.reduce((sum, id) => sum + germanFeatureCost[id], 0);
  const t = timelineFactor[timeline];
  return {
    low: roundTo((baseLow + extras * 0.85) * t * factor, 500),
    high: roundTo((baseHigh + extras * 1.15) * t * factor, 500),
  };
};

/** Devixa's indicative range (30 % below the German market). */
export const estimateRange = (system: SystemType, features: readonly FeatureId[], timeline: TimelineId) =>
  devixaRange(system, features, timeline, DEVIXA_FACTOR);

/** The German market reference for the same configuration, for comparison in the UI. */
export const marketRange = (system: SystemType, features: readonly FeatureId[], timeline: TimelineId) =>
  devixaRange(system, features, timeline, 1);

export const formatEuro = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
export const devixaPricing = {
  website: {
    low: 949,
    high: 3000,
    maintenanceLow: 39,
    maintenanceHigh: 79,
  },
  webshop: {
    low: 1499,
    high: 4299,
    maintenanceLow: 49,
    maintenanceHigh: 139,
  },
  'business-system': null,
  integration: null,
} as const;
export const devixaFeaturePrices = {
  multilang: 150,
  cms: 200,
  booking: 250,
  payments: 250,
  portal: 350,
  dashboard: 200,
  api: 250,
  ai: 350,
  migration: 150,
} as const;


export const calculateDevixaPrice = (
  system: SystemType,
  features: readonly FeatureId[],
  timeline: TimelineId,
) => {

  const pricing = devixaPricing[system];

  if (!pricing) return null;

  const extras = [...new Set(features)].reduce(
    (total, feature) => total + devixaFeaturePrices[feature],
    0,
  );


const timelineExtra =
  timeline === 'priority'
    ? 150
    : timeline === 'flexible'
      ? 100
      : 0;

return {
  price: Math.min(
    pricing.low + extras + timelineExtra,
    pricing.high,
  ),
  min: pricing.low,
  max: pricing.high,
  maintenanceLow: pricing.maintenanceLow,
  maintenanceHigh: pricing.maintenanceHigh,
};

};
