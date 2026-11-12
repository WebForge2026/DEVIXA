import type { Lead, Presence, Range, TelemetryEvent } from './types';
import { rangeDays } from './types';

const DAY = 86_400_000;
export const LIVE_WINDOW_MS = 60_000;

const dayKey = (iso: string | number) => new Date(iso).toISOString().slice(0, 10);

const lastDays = (days: number, end = Date.now()) =>
  Array.from({ length: days }, (_, i) => dayKey(end - (days - 1 - i) * DAY));

/** Visits = distinct (daily visitor hash, day). The hash rotates daily, so a visit is "one person on one day". */
const countVisits = (events: TelemetryEvent[]) => new Set(events.map((e) => `${dayKey(e.createdAt)}|${e.visitor}`)).size;

const pageLabel = (path: string) => {
  const p = path.replace(/^\/(de|en|bg)(?=\/|$)/, '') || '/';
  if (p === '/') return 'Home';
  if (p.startsWith('/services/')) return `Service · ${p.split('/')[2]}`;
  if (p.startsWith('/insights/')) return `Insight · ${p.split('/')[2]}`;
  if (p === '/imprint') return 'Impressum';
  if (p === '/privacy') return 'Datenschutz';
  return p;
};

export type TrendPoint = { day: string; visitors: number; pageviews: number; calcStarts: number; leads: number };
export type FunnelStep = { key: string; label: string; value: number };
export type HeatCell = { day: string; visits: number; leads: number; score: number };

export type Overview = {
  range: Range;
  kpis: {
    live: number;
    visits: number;
    visitsPrev: number;
    visitsSpark: number[];
    pageviews: number;
    leads: number;
    quotes: number;
    conversion: number;
    pipeline: number;
    unread: number;
  };
  trend: TrendPoint[];
  funnel: FunnelStep[];
  efficiency: number;
  heatmap: HeatCell[];
  pages: { page: string; views: number; visitors: number }[];
  livePages: { page: string; visitors: number }[];
  locales: { locale: string; views: number }[];
};

export const livePages = (presence: Presence[], now = Date.now()) => {
  const active = presence.filter((p) => now - Date.parse(p.lastSeen) <= LIVE_WINDOW_MS);
  const byPage = new Map<string, number>();
  active.forEach((p) => byPage.set(pageLabel(p.path), (byPage.get(pageLabel(p.path)) ?? 0) + 1));
  return {
    live: active.length,
    pages: [...byPage.entries()].map(([page, visitors]) => ({ page, visitors })).sort((a, b) => b.visitors - a.visitors),
  };
};

/** Pure aggregation: raw events + leads → everything the dashboard shows for one range. */
export const buildOverview = (range: Range, events: TelemetryEvent[], leads: Lead[], presence: Presence[], now = Date.now()): Overview => {
  const days = rangeDays[range];
  const start = range === 'today' ? new Date(dayKey(now)).getTime() : now - days * DAY;
  const prevStart = start - (range === 'today' ? DAY : days * DAY);

  const inRange = events.filter((e) => Date.parse(e.createdAt) >= start);
  const inPrev = events.filter((e) => Date.parse(e.createdAt) >= prevStart && Date.parse(e.createdAt) < start);
  const views = inRange.filter((e) => e.type === 'pageview');
  const leadsInRange = leads.filter((l) => Date.parse(l.createdAt) >= start);
  const quotes = leadsInRange.filter((l) => l.kind === 'quote');

  const visits = countVisits(views);
  const visitsPrev = countVisits(inPrev.filter((e) => e.type === 'pageview'));

  const trendDays = lastDays(Math.max(days, 1), now);
  const trend: TrendPoint[] = trendDays.map((day) => {
    const dayEvents = inRange.filter((e) => dayKey(e.createdAt) === day);
    const dayViews = dayEvents.filter((e) => e.type === 'pageview');
    return {
      day,
      visitors: new Set(dayViews.map((e) => e.visitor)).size,
      pageviews: dayViews.length,
      calcStarts: new Set(dayEvents.filter((e) => e.type === 'calc_view').map((e) => e.visitor)).size,
      leads: leadsInRange.filter((l) => dayKey(l.createdAt) === day).length,
    };
  });

  const uniq = (type: TelemetryEvent['type']) => new Set(inRange.filter((e) => e.type === type).map((e) => `${dayKey(e.createdAt)}|${e.visitor}`)).size;
  const calcOpened = uniq('calc_view');
  const calcUsed = uniq('calc_interact');
  const funnel: FunnelStep[] = [
    { key: 'visits', label: 'Site visits', value: visits },
    { key: 'opened', label: 'Calculator opened', value: calcOpened },
    { key: 'calculated', label: 'Quote calculated', value: calcUsed },
    { key: 'submitted', label: 'Lead submitted', value: quotes.length },
  ];
  const efficiency = calcOpened > 0 ? Math.min(100, Math.round((quotes.length / calcOpened) * 100)) : 0;

  // 12-week consistency matrix (always 84 days, independent of the selected range).
  const heatDays = lastDays(84, now);
  const heatVisits = heatDays.map((day) => countVisits(events.filter((e) => e.type === 'pageview' && dayKey(e.createdAt) === day)));
  const heatLeads = heatDays.map((day) => leads.filter((l) => dayKey(l.createdAt) === day).length);
  const maxScore = Math.max(1, ...heatDays.map((_, i) => heatVisits[i]! + heatLeads[i]! * 5));
  const heatmap = heatDays.map((day, i) => ({
    day,
    visits: heatVisits[i]!,
    leads: heatLeads[i]!,
    score: (heatVisits[i]! + heatLeads[i]! * 5) / maxScore,
  }));

  const pageMap = new Map<string, { views: number; visitors: Set<string> }>();
  views.forEach((e) => {
    const key = pageLabel(e.path);
    const entry = pageMap.get(key) ?? { views: 0, visitors: new Set<string>() };
    entry.views += 1;
    entry.visitors.add(`${dayKey(e.createdAt)}|${e.visitor}`);
    pageMap.set(key, entry);
  });
  const localeMap = new Map<string, number>();
  views.forEach((e) => localeMap.set(e.locale, (localeMap.get(e.locale) ?? 0) + 1));

  const live = livePages(presence, now);
  const sparkDays = lastDays(14, now);

  return {
    range,
    kpis: {
      live: live.live,
      visits,
      visitsPrev,
      visitsSpark: sparkDays.map((day) => countVisits(events.filter((e) => e.type === 'pageview' && dayKey(e.createdAt) === day))),
      pageviews: views.length,
      leads: leadsInRange.length,
      quotes: quotes.length,
      conversion: visits > 0 ? (leadsInRange.length / visits) * 100 : 0,
      pipeline: quotes.reduce((sum, l) => sum + ((l.priceLow ?? 0) + (l.priceHigh ?? 0)) / 2, 0),
      unread: leads.filter((l) => l.status === 'new').length,
    },
    trend,
    funnel,
    efficiency,
    heatmap,
    pages: [...pageMap.entries()]
      .map(([page, v]) => ({ page, views: v.views, visitors: v.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 12),
    livePages: live.pages,
    locales: [...localeMap.entries()].map(([locale, v]) => ({ locale, views: v })).sort((a, b) => b.views - a.views),
  };
};
