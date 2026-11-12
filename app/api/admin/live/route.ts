import { NextResponse } from 'next/server';
import { noStore, requireAdmin } from '@/lib/admin/session';
import { getStore } from '@/lib/admin/store';
import { livePages } from '@/lib/admin/telemetry';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const store = getStore();
  const presence = await store.listPresence(new Date(Date.now() - 120_000));
  return NextResponse.json({ ...livePages(presence), store: { kind: store.kind, persistent: store.persistent } }, noStore);
};
