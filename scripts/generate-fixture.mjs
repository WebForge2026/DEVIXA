/**
 * Generates the overview parity fixture from the TypeScript implementation
 * (the oracle). The PHP port must reproduce `expected` byte-for-byte.
 * Run: npx tsx scripts/generate-fixture.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildOverview } from '../lib/admin/telemetry';

const DAY = 86_400_000;
const now = Date.parse('2026-11-14T12:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

const visitors = ['v1', 'v2', 'v3'];
const paths = ['/de', '/de/services/web-systems', '/en', '/bg', '/de/imprint'];
const events = [];
for (let d = 89; d >= 0; d -= 1) {
  for (let v = 0; v < visitors.length; v += 1) {
    if ((d + v) % 3 === 0) continue;
    const base = now - d * DAY - v * 3_600_000;
    events.push({ type: 'pageview', path: paths[(d + v) % paths.length], locale: paths[(d + v) % paths.length].split('/')[1] ?? 'de', visitor: visitors[v], createdAt: iso(base) });
    if ((d + v) % 4 === 0) events.push({ type: 'calc_view', path: '/de', locale: 'de', visitor: visitors[v], createdAt: iso(base + 60_000) });
    if ((d + v) % 7 === 0) events.push({ type: 'calc_interact', path: '/de', locale: 'de', visitor: visitors[v], createdAt: iso(base + 90_000) });
  }
}

const mkLead = (i, daysAgo, kind, status) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  kind,
  createdAt: iso(now - daysAgo * DAY - 3_600_000),
  status,
  notes: '',
  name: kind === 'contact' ? `Kunde ${i}` : null,
  email: `lead${i}@example.com`,
  company: null,
  phone: null,
  priceLow: kind === 'quote' ? 5000 + i * 1000 : null,
  priceHigh: kind === 'quote' ? 11000 + i * 1000 : null,
  budgetLabel: null,
  projectType: null,
  message: null,
  config: kind === 'quote' ? { systemType: 'website', features: ['cms'], timeline: 'standard' } : null,
  locale: 'de',
});
const leads = [
  mkLead(1, 1, 'quote', 'new'),
  mkLead(2, 2, 'contact', 'contacted'),
  mkLead(3, 5, 'quote', 'won'),
  mkLead(4, 9, 'contact', 'new'),
  mkLead(5, 30, 'quote', 'archived'),
  mkLead(6, 45, 'contact', 'proposal'),
  mkLead(7, 80, 'quote', 'new'),
];

const presence = [
  { visitor: 'v1', path: '/de', lastSeen: iso(now - 20_000) },
  { visitor: 'v2', path: '/en/services/web-systems', lastSeen: iso(now - 90_000) },
  { visitor: 'stale', path: '/de', lastSeen: iso(now - 400_000) },
];

mkdirSync('tests/fixtures', { recursive: true });
const fixture = { range: '30d', now, events, leads, presence, expected: buildOverview('30d', events, leads, presence, now) };
writeFileSync('tests/fixtures/overview.json', JSON.stringify(fixture));
console.log(`fixture written: ${events.length} events, ${leads.length} leads`);
