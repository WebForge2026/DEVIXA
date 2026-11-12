// Local development only: fills .data/admin-store.json with DEMO telemetry and leads so the
// Command Center can be explored. Never touches Supabase. Usage: npm run admin:seed [-- --force]
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), '.data', 'admin-store.json');
if (existsSync(file) && !process.argv.includes('--force')) {
  console.log(`${file} already exists — run with --force to replace it.`);
  process.exit(0);
}

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (list) => list[Math.floor(rnd() * list.length)];
const DAY = 86_400_000;
const now = Date.now();

const pages = ['/de', '/de', '/de', '/en', '/bg', '/de/services/web-systems', '/de/services/automation-integration', '/en/services/web-systems', '/de/insights/ai-agent-automation', '/de/imprint'];
const events = [];
for (let d = 89; d >= 0; d -= 1) {
  const weekday = new Date(now - d * DAY).getDay();
  const base = (weekday === 0 || weekday === 6 ? 6 : 14) + (90 - d) * 0.12;
  const visitors = Math.round(base * (0.7 + rnd() * 0.6));
  for (let v = 0; v < visitors; v += 1) {
    const visitor = `demo${d}x${v}`;
    const t0 = now - d * DAY - Math.floor(rnd() * DAY * 0.9);
    const views = 1 + Math.floor(rnd() * 3);
    for (let p = 0; p < views; p += 1) {
      const route = pick(pages);
      events.push({ type: 'pageview', path: route, locale: route.split('/')[1], visitor, createdAt: new Date(t0 + p * 40_000).toISOString() });
    }
    if (rnd() < 0.42) events.push({ type: 'calc_view', path: '/de', locale: 'de', visitor, createdAt: new Date(t0 + 60_000).toISOString() });
    if (rnd() < 0.18) events.push({ type: 'calc_interact', path: '/de', locale: 'de', visitor, createdAt: new Date(t0 + 90_000).toISOString() });
  }
}

const systems = ['website', 'webshop', 'business-system', 'integration'];
const features = ['multilang', 'cms', 'booking', 'payments', 'portal', 'dashboard', 'api', 'ai', 'migration'];
const leads = Array.from({ length: 14 }, (_, i) => {
  const quote = i % 3 !== 0;
  const createdAt = new Date(now - Math.floor(rnd() * 60) * DAY - Math.floor(rnd() * DAY)).toISOString();
  const status = pick(['new', 'new', 'contacted', 'proposal', 'won', 'archived']);
  if (quote) {
    const low = 4000 + Math.round(rnd() * 30) * 1000;
    return {
      id: randomUUID(), kind: 'quote', createdAt, status, notes: '', name: null, email: `demo.quote${i}@example.com`, company: null, phone: null,
      priceLow: low, priceHigh: low + 6000 + Math.round(rnd() * 20) * 1000, budgetLabel: null, projectType: null, message: null,
      config: { systemType: pick(systems), features: features.filter(() => rnd() < 0.3), timeline: pick(['flexible', 'standard', 'priority']) }, locale: pick(['de', 'en', 'bg']),
    };
  }
  return {
    id: randomUUID(), kind: 'contact', createdAt, status, notes: '', name: `Demo Kunde ${i}`, email: `demo.contact${i}@example.com`, company: 'Demo GmbH', phone: null,
    priceLow: null, priceHigh: null, budgetLabel: '15.000 – 40.000 €', projectType: 'Individuelles Websystem',
    message: 'DEMO-DATEN: Wir suchen ein Buchungssystem für drei Standorte.', config: null, locale: 'de',
  };
});

const previous = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify({ events, presence: {}, leads, content: previous.content ?? { texts: {}, media: [], theme: { accent: '#FF2A2A', cardRadius: 0, glow: 0.16, sphereRed: 0.2 }, updatedAt: null } }));
console.log(`Demo data written: ${events.length} events, ${leads.length} leads → ${file}`);
