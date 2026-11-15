import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { describe, it } from 'node:test';
import { createSessionToken, safeEqual, SESSION_HOURS, verifySessionToken } from '../lib/admin/auth';

// Node 18 (local dev) has no global WebCrypto; Node 20+/22 (Hetzner) does.
// auth.ts only touches crypto inside functions, so setting it before the tests run is sufficient.
if (!globalThis.crypto) (globalThis as { crypto?: unknown }).crypto = webcrypto;

describe('admin session tokens', () => {
  it('round-trips a valid token', async () => {
    const token = await createSessionToken('admin@devixa.de');
    const session = await verifySessionToken(token);
    assert.ok(session);
    assert.equal(session.email, 'admin@devixa.de');
  });

  it('rejects a tampered payload', async () => {
    const token = await createSessionToken('admin@devixa.de');
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ email: 'admin@devixa.de', exp: Date.now() + 9_999_999 })).toString('base64url');
    assert.equal(await verifySessionToken(`${forged}.${sig}`), null);
    assert.equal(await verifySessionToken(`${payload}.${sig}x`), null);
  });

  it('rejects expired tokens', async () => {
    process.env.ADMIN_SESSION_SECRET = 'x'.repeat(40);
    try {
      const valid = await createSessionToken('admin@devixa.de');
      const [, sig] = valid.split('.');
      const expiredPayload = Buffer.from(JSON.stringify({ email: 'admin@devixa.de', exp: Date.now() - 1_000 })).toString('base64url');
      assert.equal(await verifySessionToken(`${expiredPayload}.${sig}`), null);
    } finally {
      delete process.env.ADMIN_SESSION_SECRET;
    }
  });

  it('rejects garbage and missing secrets', async () => {
    assert.equal(await verifySessionToken(undefined), null);
    assert.equal(await verifySessionToken('not-a-token'), null);
  });

  it('session lifetime is 12 hours', () => {
    assert.equal(SESSION_HOURS, 12);
  });

  it('safeEqual compares constant-time and handles length mismatch', () => {
    assert.equal(safeEqual('abc', 'abc'), true);
    assert.equal(safeEqual('abc', 'abd'), false);
    assert.equal(safeEqual('abc', 'abcd'), false);
    assert.equal(safeEqual('', ''), true);
  });
});
