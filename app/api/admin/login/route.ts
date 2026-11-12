import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminConfig, createSessionToken, safeEqual, sessionCookieOptions } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

// Brute-force brake: 5 attempts per IP per 10 minutes (per server instance).
const attempts = new Map<string, number[]>();
const WINDOW = 10 * 60_000;

export const POST = async (request: NextRequest) => {
  const config = adminConfig();
  if (!config.enabled || !config.password) {
    return NextResponse.json({ error: 'disabled' }, { status: 503 });
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const recent = (attempts.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW);
  if (recent.length >= 5) return NextResponse.json({ error: 'rate' }, { status: 429 });

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const valid = safeEqual(email, config.email) && safeEqual(password, config.password);

  if (!valid) {
    attempts.set(ip, [...recent, Date.now()]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: 'credentials' }, { status: 401 });
  }
  attempts.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(email), sessionCookieOptions());
  return response;
};
