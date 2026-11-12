import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/lib/admin/store';
import { eventTypes, type EventType } from '@/lib/admin/types';
import { isLocale } from '@/lib/i18n/config';

/**
 * Cookieless first-party telemetry beacon.
 * The visitor id is a SHA-256 hash of a secret salt, today's date, IP and user agent — rotated daily,
 * IP/UA are never stored, nothing is written to the visitor's device. Honours DNT and GPC.
 */
export const dynamic = 'force-dynamic';

const instanceSalt = randomBytes(16).toString('hex');
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|java\//i;
const MAX_PER_MINUTE = 90;
const hits = new Map<string, { minute: number; count: number }>();

const visitorHash = (request: NextRequest) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  const salt = process.env.ADMIN_SESSION_SECRET ?? instanceSalt;
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${salt}|${day}|${ip}|${ua}`).digest('hex').slice(0, 20);
};

const limited = (visitor: string) => {
  const minute = Math.floor(Date.now() / 60_000);
  const entry = hits.get(visitor);
  if (!entry || entry.minute !== minute) {
    hits.set(visitor, { minute, count: 1 });
    if (hits.size > 10_000) hits.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_MINUTE;
};

export const POST = async (request: NextRequest) => {
  const ok = new NextResponse(null, { status: 204 });
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua) || request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return ok;

  let body: { type?: string; path?: string; locale?: string };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return ok;
  }
  const type = body.type;
  const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '';
  const locale = typeof body.locale === 'string' && isLocale(body.locale) ? body.locale : 'de';
  if (!path.startsWith('/') || path.startsWith('/admin')) return ok;
  if (type !== 'heartbeat' && !(eventTypes as readonly string[]).includes(type ?? '')) return ok;

  const visitor = visitorHash(request);
  if (limited(visitor)) return ok;

  const now = new Date().toISOString();
  const store = getStore();
  try {
    await store.heartbeat({ visitor, path, lastSeen: now });
    if (type !== 'heartbeat') await store.recordEvent({ type: type as EventType, path, locale, visitor, createdAt: now });
  } catch (error) {
    console.error('[telemetry]', error);
  }
  return ok;
};
