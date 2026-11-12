import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from './auth';

/** Returns the admin session, or a 401 response to return from the route handler. */
export const requireAdmin = async () => {
  const session = await verifySessionToken(cookies().get(ADMIN_COOKIE)?.value);
  return session ? { session, denied: null } : { session: null, denied: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
};

export const noStore = { headers: { 'Cache-Control': 'no-store' } };
