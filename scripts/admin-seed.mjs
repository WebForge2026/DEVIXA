// Local development only: fills DEMO telemetry and leads so the Command Center can
// be explored. Two targets:
//   node scripts/admin-seed.mjs          → .data/admin-store.json (file store)
//   node scripts/admin-seed.mjs --db     → MariaDB (DATABASE_URL), idempotent
// Demo rows are tagged (visitor 'demo…' / e-mail 'demo.…@example.com'); the --db
// mode skips the seed if demo data already exists, so it is safe to re-run.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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

const defaultContent = { texts: {}, media: [], theme: { accent: '#FF2A2A', cardRadius: 0, glow: 0.16, sphereRed: 0.2 }, updatedAt: null };

/* ---------------------------------------------------------------- file mode */
const seedFile = () => {
  const file = path.join(process.cwd(), '.data', 'admin-store.json');
  if (existsSync(file) && !process.argv.includes('--force')) {
    console.log(`${file} already exists — run with --force to replace it.`);
    process.exit(0);
  }
  const previous = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ events, presence: {}, leads, content: previous.content ?? defaultContent }));
  console.log(`Demo data written: ${events.length} events, ${leads.length} leads → ${file}`);
};

/* ------------------------------------------------------------------- db mode */
const seedDb = async () => {
  const { default: mysql } = await import('mysql2/promise');
  const toDbTs = (iso) => iso.slice(0, 23).replace('T', ' ');
  const client = await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true });
  try {
    const [[existing]] = await client.query(
      "select (select count(*) from leads where email like 'demo.%@example.com') as leads, (select count(*) from site_events where visitor like 'demo%') as events",
    );
    if (!process.argv.includes('--force') && (Number(existing.leads) > 0 || Number(existing.events) > 0)) {
      console.log(`Demo data already present (${existing.leads} leads, ${existing.events} events) — nothing written. Use --force to add another batch.`);
      return;
    }

    await client.query('start transaction');
    for (const e of events) {
      await client.query('insert into site_events (type, path, locale, visitor, created_at) values (?,?,?,?,?)', [e.type, e.path, e.locale, e.visitor, toDbTs(e.createdAt)]);
    }
    for (const l of leads) {
      if (l.kind === 'quote') {
        await client.query(
          'insert into project_estimates (system_type, features, timeline, estimated_price, contact_email, status, price_low, price_high, locale, created_at) values (?,?,?,?,?,?,?,?,?,?)',
          [l.config.systemType, JSON.stringify(l.config.features), l.config.timeline, `EUR ${l.priceLow}-${l.priceHigh}`, l.email, l.status, l.priceLow, l.priceHigh, l.locale, toDbTs(l.createdAt)],
        );
      } else {
        await client.query(
          'insert into leads (full_name, email, company, project_type, estimated_budget, message, status, locale, created_at) values (?,?,?,?,?,?,?,?,?)',
          [l.name, l.email, l.company, l.projectType, l.budgetLabel, l.message, l.status, l.locale, toDbTs(l.createdAt)],
        );
      }
    }
    await client.query('insert into site_content (id, data) values (?, ?) on duplicate key update data = values(data)', ['live', JSON.stringify(defaultContent)]);
    await client.query('commit');
    console.log(`Demo data written to MariaDB: ${events.length} events, ${leads.length} leads.`);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
};

if (process.argv.includes('--db')) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for --db seeding.');
    process.exit(1);
  }
  seedDb().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
} else {
  seedFile();
}
