import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const fresh = readFileSync('database/schema.sql', 'utf8');

const ddlOf = (sql: string) =>
  sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();

const migrationDdls = ddlOf(
  readdirSync('database/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(`database/migrations/${f}`, 'utf8'))
    .join('\n')
);

describe('database migrations (MariaDB)', () => {
  it('schema.sql DDL equals the concatenation of all migrations', () => {
    assert.equal(ddlOf(fresh), migrationDdls);
  });

  it('all application tables plus the housekeeping tables are present', () => {
    for (const t of ['leads', 'project_estimates', 'site_events', 'site_presence', 'site_content', 'audit_log', '_rate_limits']) {
      assert.ok(fresh.includes(`create table if not exists ${t}`), `missing ${t}`);
    }
  });

  it('is portable MariaDB: no PostgreSQL artifacts, no extensions, no Supabase RLS', () => {
    assert.ok(!/create extension/i.test(fresh), 'extensions are not available on shared hosting');
    assert.ok(!/gen_random_uuid|public\./.test(fresh), 'PostgreSQL-specific syntax must not appear');
    assert.ok(!/auth\.uid|auth\.users|auth\.role|auth\.jwt/.test(fresh), 'Supabase auth dependencies must not appear');
    assert.ok(!/enable row level security|create policy/.test(fresh), 'RLS/grants are Supabase-specific; authz is server-side');
    assert.ok(!/~\*/.test(fresh), 'PostgreSQL regex operator cannot be used in CHECK on MariaDB');
  });

  it('is InnoDB, re-runnable, and free of transaction wrappers (MySQL DDL implies commits)', () => {
    assert.ok(!/start transaction|commit;/.test(fresh), 'MySQL/MariaDB DDL causes implicit commits — no transaction wrappers');
    assert.ok((fresh.match(/engine = innodb/g) ?? []).length >= 7, 'every table must be InnoDB');
    assert.ok(fresh.includes('create table if not exists'), 'tables must use IF NOT EXISTS');
    assert.ok(fresh.includes('create index if not exists'), 'indexes must use IF NOT EXISTS');
  });

  it('preserves the Supabase-era CHECK constraints that MariaDB can enforce', () => {
    for (const fragment of [
      "check (status in ('new', 'contacted', 'proposal', 'won', 'archived', 'qualified', 'lost', 'spam'))",
      "check (system_type in ('website', 'webshop', 'business-system', 'integration'))",
      "check (timeline in ('flexible', 'standard', 'priority'))",
      "check (type in ('pageview', 'calc_view', 'calc_interact'))",
      "check (locale in ('de', 'en', 'bg'))",
      'default (uuid())',
      'auto_increment',
    ]) {
      assert.ok(fresh.includes(fragment), `missing: ${fragment}`);
    }
  });

  it('files are versioned and parseable', () => {
    const files = readdirSync('database/migrations').filter((f) => f.endsWith('.sql'));
    assert.deepEqual(files, [...files].sort());
    assert.ok(files.length >= 2);
    for (const f of files) assert.match(f, /^\d{4}_[a-z0-9_]+\.sql$/);
  });
});

describe('PHP backend presence', () => {
  it('all runtime endpoints exist', () => {
    for (const f of [
      'php/api/t.php', 'php/api/leads.php', 'php/api/estimate.php', 'php/api/health.php', 'php/api/content.php', 'php/api/session.php',
      'php/api/admin/login.php', 'php/api/admin/logout.php', 'php/api/admin/overview.php', 'php/api/admin/live.php',
      'php/api/admin/leads.php', 'php/api/admin/leads-update.php', 'php/api/admin/content.php',
      'php/lib/bootstrap.php', 'php/lib/auth.php', 'php/lib/store.php', 'php/lib/overview.php', 'php/lib/estimate.php', 'php/lib/ratelimit.php',
      'php/deploy/.htaccess', 'php/deploy/locale.php', 'database/migrate.php', 'database/export-cms.php',
    ]) {
      assert.ok(readFileSync(f, 'utf8').length > 0, `${f} missing or empty`);
    }
  });
});
