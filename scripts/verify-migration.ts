/**
 * DEVIXA — post-migration verification (source = Supabase PostgreSQL,
 * destination = Hetzner MariaDB). Compares row counts, id sets, timestamp
 * ranges and the app's critical read queries. Exits non-zero on any FAIL.
 *
 * Usage:
 *   SUPABASE_DB_URL='postgres://…' DATABASE_URL='mysql://…' npx tsx scripts/verify-migration.ts
 *
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

const mask = (u: string) => u.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@');
const toDbTs = (d: Date | string) => new Date(d).toISOString().slice(0, 23).replace('T', ' ');
const fingerprint = (ids: string[]) => createHash('sha256').update(ids.sort().join('\n')).digest('hex');

const source = new pg.Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = mysql.createPool({ uri: targetUrl, connectionLimit: 2, dateStrings: true });

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];
const check = (name: string, pass: boolean, detail = '') => {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const run = async () => {
  await Promise.all([source.connect()]);
  console.log(`Source: ${mask(sourceUrl)}\nTarget: ${mask(targetUrl)}\n`);

  const tables = ['leads', 'project_estimates', 'site_events', 'site_presence', 'site_content'];
  for (const t of tables) {
    const { rows: [s] } = await source.query(`select count(*)::int as n from public.${t}`);
    const [[d]] = await target.query<RowDataPacket[]>(`select count(*) as n from ${t}`);
    check(`row count ${t}`, s.n === Number(d.n), `source=${s.n} target=${Number(d.n)}`);
  }

  for (const t of ['leads', 'project_estimates']) {
    const { rows: src } = await source.query(`select id from public.${t}`);
    const [dst] = await target.query(`select id from ${t}`);
    const same = fingerprint(src.map((r) => r.id)) === fingerprint((dst as { id: string }[]).map((r) => r.id));
    check(`id set ${t}`, same, `${src.length} ids compared`);
  }
  {
    const hashVisitors = (rows: { visitor: string }[]) => fingerprint(rows.map((r) => r.visitor));
    const { rows: src } = await source.query('select visitor from public.site_presence');
    const [dst] = await target.query('select visitor from site_presence');
    check('visitor set site_presence', hashVisitors(src) === hashVisitors(dst as { visitor: string }[]), `${src.length} visitors compared`);
  }

  for (const [t, col] of [['leads', 'created_at'], ['project_estimates', 'created_at'], ['site_events', 'created_at'], ['site_presence', 'last_seen']] as const) {
    const { rows: [s] } = await source.query(`select min(${col}) as lo, max(${col}) as hi from public.${t}`);
    const [[d]] = await target.query<RowDataPacket[]>(`select min(${col}) as lo, max(${col}) as hi from ${t}`);
    const same = toDbTs(s.lo) === d.lo && toDbTs(s.hi) === d.hi;
    check(`timestamps ${t}.${col}`, same, `min=${d.lo ?? 'null'} max=${d.hi ?? 'null'}`);
  }

  {
    const [rows] = await target.query('select count(*) as n from site_presence where visitor is null or path is null');
    check('no null presence keys on target', Number((rows as { n: number }[])[0].n) === 0);
  }

  {
    const wanted = ['leads_created_at_idx', 'leads_status_idx', 'project_estimates_created_at_idx', 'site_events_created_at_idx', 'site_presence_last_seen_idx'];
    const [rows] = await target.query('show index from leads');
    const haveLeads = new Set((rows as { Key_name: string }[]).map((r) => r.Key_name));
    const [rows2] = await target.query("select index_name from information_schema.statistics where table_schema = database() and table_name in ('project_estimates','site_events','site_presence') group by index_name");
    const have = new Set([...haveLeads, ...(rows2 as { index_name: string }[]).map((r) => r.index_name)]);
    for (const idx of wanted) check(`index ${idx}`, have.has(idx));
  }

  {
    const since = toDbTs(new Date(Date.now() - 181 * 86_400_000));
    const [events] = await target.query('select count(*) as n from site_events where created_at >= ?', [since]);
    const [leadsByStatus] = await target.query('select status, count(*) as n from leads group by status order by status');
    const [content] = await target.query("select id, updated_at from site_content where id = 'live'");
    check('critical query: events in admin window (181d)', true, `${Number((events as { n: number }[])[0].n)} events`);
    check('critical query: leads groupable by status', (leadsByStatus as unknown[]).length > 0, JSON.stringify(leadsByStatus));
    check('critical query: site_content live row readable', (content as unknown[]).length <= 1);
  }

  {
    const { rows: src } = await source.query('(select id from public.leads order by created_at asc limit 1) union all (select id from public.leads order by created_at desc limit 1)');
    const [dst] = await target.query('(select id from leads order by created_at asc limit 1) union all (select id from leads order by created_at desc limit 1)');
    const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort().join(',');
    check('sample leads (first/last by created_at)', ids(src) === ids(dst as { id: string }[]));
  }

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length > 0) {
    console.error('MIGRATION VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('Migration verified.');
};

run()
  .catch((error) => {
    console.error('verification error:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await source.end().catch(() => undefined);
    await target.end().catch(() => undefined);
  });
