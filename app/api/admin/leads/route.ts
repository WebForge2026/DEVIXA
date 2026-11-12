import { NextResponse } from 'next/server';
import { noStore, requireAdmin } from '@/lib/admin/session';
import { getStore } from '@/lib/admin/store';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ leads: await getStore().listLeads() }, noStore);
};
