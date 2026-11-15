/**
 * DEVIXA — one-time data copy: Supabase PostgreSQL → Hetzner MariaDB.
 * pg_dump output cannot be replayed into MariaDB (different SQL dialect), so
 * this script copies table-by-table over the wire, preserving ids, timestamps
 * and JSON payloads, then verifies counts, id sets and timestamp ranges.
 *
 * Usage:
 *   SUPABASE_DB_URL='postgres://…' DATABASE_URL='mysql://…' \
 *   MIGRATE_DATA_CONFIRM=yes npx tsx scripts/migrate-data.ts
 *
 * Idempotent by design: wipes nothing. If run twice it will duplicate rows —
 * run it once against an empty target (or after re-creating the tables).
 * Connection strings are never printed.
 */
import { createHash } from 'node:crypto';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import pg from 'pg';

const sourceUrl = process.env.SUPABASE_DB_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !targetUrl) {
  console.error('SUPABASE_DB_URL and DATABASE_URL are both required.');
  process.exit(1);
}
if (process.env.MIGRATE_DATA_CONFIRM !== 'yes') {
  console.error('Refusing to copy data: set MIGRATE_DATA_CONFIRM=yes explicitly.');
  process.exit(1);
}

const mask = (u: string) => u.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@');
const toDbTs = (d: Date) => d.toISOString().slice(0, 23).replace('T', ' ');
const fingerprint = (ids: string[]) => createHash('sha256').update(ids.sort().join('\n')).digest('hex');

const source = new pg.Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = mysql.createPool({ uri: targetUrl, waitForConnections: true, connectionLimit: 3, dateStrings: true });

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];
const check = (name: string, pass: boolean, detail = '') => {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const run = async () => {
  await source.connect();
  console.log(`Source: ${mask(sourceUrl)}\nTarget: ${mask(targetUrl)}\n`);

  const copy = async (name: string, rows: Record<string, unknown>[], insert: (r: Record<string, unknown>) => Promise<void>) => {
    console.log(`copy   ${name}: ${rows.length} rows`);
    for (const row of rows) await insert(row);
  };

  // --- site_content (single row) -------------------------------------------
  {
    const { rows } = await source.query('select id, data, updated_at from public.site_content');
    await copy('site_content', rows, async (r) => {
      await target.query(
        'insert into site_content (id, data, updated_at) values (?, ?, ?) on duplicate key update data = values(data), updated_at = values(updated_at)',
        [r.id, JSON.stringify(r.data), toDbTs(r.updated_at as Date)],
      );
    });
  }

  // --- site_presence ---------------------------------------------------------
  {
    const { rows } = await source.query('select visitor, path, last_seen from public.site_presence');
    await copy('site_presence', rows, async (r) => {
      await target.query(
        'insert into site_presence (visitor, path, last_seen) values (?, ?, ?) on duplicate key update path = values(path), last_seen = values(last_seen)',
        [r.visitor, r.path, toDbTs(r.last_seen as Date)],
      );
    });
  }

  // --- leads -----------------------------------------------------------------
  {
    const { rows } = await source.query('select id, created_at, full_name, email, company, project_type, estimated_budget, message, status, notes, locale from public.leads order by created_at');
    await copy('leads', rows, async (r) => {
      await target.query(
        'insert into leads (id, created_at, full_name, email, company, project_type, estimated_budget, message, status, notes, locale) values (?,?,?,?,?,?,?,?,?,?,?)',
        [r.id, toDbTs(r.created_at as Date), r.full_name, r.email, r.company, r.project_type, r.estimated_budget, r.message, r.status, r.notes, r.locale],
      );
    });
  }

  // --- project_estimates -------------------------------------------------------
  {
    const { rows } = await source.query('select id, created_at, system_type, features, timeline, estimated_price, contact_email, status, notes, price_low, price_high, locale from public.project_estimates order by created_at');
    await copy('project_estimates', rows, async (r) => {
      await target.query(
        'insert into project_estimates (id, created_at, system_type, features, timeline, estimated_price, contact_email, status, notes, price_low, price_high, locale) values (?,?,?,?,?,?,?,?,?,?,?,?)',
        [r.id, toDbTs(r.created_at as Date), r.system_type, JSON.stringify(r.features ?? []), r.timeline, r.estimated_price, r.contact_email, r.status, r.notes, r.price_low, r.price_high, r.locale],
      );
    });
  }

  // --- site_events (keyset-paginated batches) ----------------------------------
  {
    let lastId = 0;
    let total = 0;
    for (;;) {
      const { rows } = await source.query('select id, created_at, type, path, locale, visitor from public.site_events where id > $1 order by id limit 5000', [lastId]);
      if (rows.length === 0) break;
      for (const r of rows) {
        await target.query('insert into site_events (id, created_at, type, path, locale, visitor) values (?,?,?,?,?,?)', [
          r.id, toDbTs(r.created_at as Date), r.type, r.path, r.locale, r.visitor,
        ]);
      }
      total += rows.length;
      lastId = rows[rows.length - 1].id;
      if (total % 50000 < 5000) console.log(`       site_events … ${total} rows`);
    }
    console.log(`copy   site_events: ${total} rows`);
    if (total > 0) await target.query('alter table site_events auto_increment = ?', [lastId + 1]);
  }

  // --- verification -------------------------------------------------------------
  console.log('\nVerification:');
  const tables = ['leads', 'project_estimates', 'site_events', 'site_presence', 'site_content'];
  for (const t of tables) {
    const [{ n: srcN }] = (await source.query(`select count(*)::int as n from public.${t}`)).rows;
    const [[dst]] = await target.query<RowDataPacket[]>(`select count(*) as n from ${t}`);
    check(`row count ${t}`, srcN === Number(dst.n), `source=${srcN} target=${Number(dst.n)}`);
  }

  for (const t of ['leads', 'project_estimates']) {
    const { rows: src } = await source.query(`select id from public.${t}`);
    const [dst] = await target.query(`select id from ${t}`);
    const same = fingerprint(src.map((r) => r.id)) === fingerprint((dst as { id: string }[]).map((r) => r.id));
    check(`id set ${t}`, same, `${src.length} ids compared`);
  }

  for (const [t, col] of [['leads', 'created_at'], ['project_estimates', 'created_at'], ['site_events', 'created_at'], ['site_presence', 'last_seen']] as const) {
    const { rows: [s] } = await source.query(`select min(${col}) as lo, max(${col}) as hi from public.${t}`);
    const [[d]] = await target.query<RowDataPacket[]>(`select min(${col}) as lo, max(${col}) as hi from ${t}`);
    const same = toDbTs(s.lo) === d.lo && toDbTs(s.hi) === d.hi;
    check(`timestamps ${t}.${col}`, same, `min=${d.lo ?? 'null'} max=${d.hi ?? 'null'}`);
  }

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length > 0) {
    console.error('DATA MIGRATION VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('Data migration verified. Next: set DATABASE_URL for the app and smoke-test.');
};

run()
  .catch((error) => {
    console.error('copy failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await source.end().catch(() => undefined);
    await target.end().catch(() => undefined);
  });
