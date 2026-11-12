/**
 * Admin session: HMAC-signed, HttpOnly cookie. Runs on Node and on the Edge (middleware),
 * so it only uses Web Crypto.
 *
 * Production requires ADMIN_PASSWORD and ADMIN_SESSION_SECRET (≥ 32 chars) as environment
 * variables. The built-in defaults below work ONLY in local development — the repository is
 * public, so hard-coded production credentials would let anyone read the leads.
 */
export const ADMIN_COOKIE = 'devixa_admin';
export const SESSION_HOURS = 12;

const DEV_EMAIL = 'admin@devixa.de';
const DEV_PASSWORD = 'devixa-admin-2026';
const DEV_SECRET = 'dev-only-insecure-session-secret-change-me';

const isProduction = () => process.env.NODE_ENV === 'production';

export const adminConfig = () => {
  const email = (process.env.ADMIN_EMAIL ?? DEV_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (isProduction() ? null : DEV_PASSWORD);
  const secret = process.env.ADMIN_SESSION_SECRET ?? (isProduction() ? null : DEV_SECRET);
  const enabled = Boolean(password && secret && (!isProduction() || secret.length >= 32));
  return { email, password, secret, enabled };
};

const encoder = new TextEncoder();

const toBase64Url = (bytes: ArrayBuffer | Uint8Array) => {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  array.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const hmac = async (secret: string, data: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
};

/** Constant-time string comparison. */
export const safeEqual = (a: string, b: string) => {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};

export const createSessionToken = async (email: string) => {
  const { secret } = adminConfig();
  if (!secret) throw new Error('Admin session secret missing');
  const payload = toBase64Url(encoder.encode(JSON.stringify({ email, exp: Date.now() + SESSION_HOURS * 3600_000 })));
  return `${payload}.${await hmac(secret, payload)}`;
};

export const verifySessionToken = async (token: string | undefined | null) => {
  const { secret, enabled } = adminConfig();
  if (!token || !secret || !enabled) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  if (!safeEqual(signature, await hmac(secret, payload))) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { email?: string; exp?: number };
    if (!json.email || !json.exp || json.exp < Date.now()) return null;
    return { email: json.email };
  } catch {
    return null;
  }
};

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_HOURS * 3600,
});
