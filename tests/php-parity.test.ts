import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// Node 18 (local dev) has no global WebCrypto; Node 20+/22 do.
if (!globalThis.crypto) (globalThis as { crypto?: unknown }).crypto = webcrypto;
import { estimateRange, marketRange, featureIds } from '../lib/estimate';
import { leadStatuses } from '../lib/admin/types';

const php = (args: string[], input?: string) =>
  execFileSync('php', args, { input, encoding: 'utf8', env: { ...process.env, DEVIXA_LIB: 'php/lib' } }).trim();

const combos: [string, string[], string][] = [
  ['website', [], 'flexible'],
  ['website', ['cms'], 'standard'],
  ['website', ['multilang', 'cms', 'seo' in featureIds ? 'cms' : 'cms'], 'priority'],
  ['webshop', ['payments', 'booking'], 'standard'],
  ['business-system', ['dashboard', 'api', 'ai'], 'priority'],
  ['business-system', featureIds.slice(), 'flexible'],
  ['integration', ['api', 'migration'], 'standard'],
  ['integration', ['ai'], 'priority'],
  ['webshop', [], 'flexible'],
];

describe('PHP parity — estimate pricing (lib/estimate.ts ↔ php/lib/estimate.php)', () => {
  for (const [system, features, timeline] of combos) {
    it(`${system} [${features.join(',')}] ${timeline}`, () => {
      const expected = estimateRange(system as never, features as never, timeline as never);
      const actual = JSON.parse(php(['php/lib/estimate.php', system, features.join(',') || '-', timeline]));
      assert.deepEqual(actual, expected);
    });
    it(`market ${system} [${features.join(',')}] ${timeline}`, () => {
      const expected = marketRange(system as never, features as never, timeline as never);
      const actual = JSON.parse(php(['php/lib/estimate.php', system, features.join(',') || '-', timeline, '--market']));
      assert.deepEqual(actual, expected);
    });
  }
});

describe('PHP parity — normalizeStatus (lib/admin/types.ts ↔ php/lib/bootstrap.php)', () => {
  const cases: [string | null, string][] = [
    [null, 'new'],
    ['garbage', 'new'],
    ['qualified', 'proposal'],
    ['lost', 'archived'],
    ['spam', 'archived'],
    ...leadStatuses.map((s) => [s, s] as [string, string]),
  ];
  for (const [input, expected] of cases) {
    it(`${String(input)} → ${expected}`, () => {
      const code = `require 'php/lib/bootstrap.php'; echo devixa_normalize_status(${input === null ? 'null' : `'${input}'`});`;
      assert.equal(php(['-r', code]), expected);
    });
  }
});

describe('PHP parity — dashboard aggregation (lib/admin/telemetry.ts ↔ php/lib/overview.php)', () => {
  it('buildOverview fixture matches byte-for-byte', () => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/overview.json', 'utf8'));
    const actual = JSON.parse(php(['php/lib/overview_cli.php', 'tests/fixtures/overview.json']));
    assert.deepEqual(actual, fixture.expected);
  });
});

describe('PHP parity — admin session tokens (lib/admin/auth.ts ↔ php/lib/auth.php)', () => {
  const secret = 'x'.repeat(40);

  const tsEnv = () => {
    process.env.ADMIN_SESSION_SECRET = secret;
    return () => delete process.env.ADMIN_SESSION_SECRET;
  };

  it('TS creates → PHP verifies', async () => {
    writeParityConfig(secret);
    const restore = tsEnv();
    const { createSessionToken } = await import('../lib/admin/auth');
    const token = await createSessionToken('admin@devixa.de');
    restore();
    const code = `require 'php/lib/auth.php'; $s = devixa_verify_session_token('${token}'); echo $s ? $s['email'] : 'null';`;
    assert.equal(php(['-r', code]), 'admin@devixa.de');
  });

  it('PHP creates → TS verifies', async () => {
    writeParityConfig(secret);
    const code = `require 'php/lib/auth.php'; echo devixa_create_session_token('admin@devixa.de');`;
    const token = php(['-r', code]);
    const restore = tsEnv();
    const { verifySessionToken } = await import('../lib/admin/auth');
    const session = await verifySessionToken(token);
    restore();
    assert.equal(session?.email, 'admin@devixa.de');
  });

  it('PHP rejects a tampered TS token', async () => {
    writeParityConfig(secret);
    const restore = tsEnv();
    const { createSessionToken } = await import('../lib/admin/auth');
    const token = await createSessionToken('admin@devixa.de');
    restore();
    const forged = token.slice(0, -2) + 'xx';
    const code = `require 'php/lib/auth.php'; var_export(devixa_verify_session_token('${forged}') !== null);`;
    assert.equal(php(['-r', code]), 'false');
  });
});

function writeParityConfig(secret: string) {
  writeFileSync(
    '/tmp/devixa-parity-config.php',
    `<?php return ['env' => 'production', 'database_url' => 'mysql://unused', 'admin_email' => 'admin@devixa.de', 'admin_password' => 'p', 'admin_session_secret' => '${secret}'];`
  );
  process.env.DEVIXA_CONFIG = '/tmp/devixa-parity-config.php';
}
