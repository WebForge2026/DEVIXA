import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/session';
import { getStore } from '@/lib/admin/store';
import { leadStatuses } from '@/lib/admin/types';

const patchSchema = z.object({
  kind: z.enum(['quote', 'contact']),
  status: z.enum(leadStatuses).optional(),
  notes: z.string().max(5000).optional(),
});

export const PATCH = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { kind, ...patch } = parsed.data;
  try {
    await getStore().updateLead(kind, params.id, patch);
  } catch (error) {
    console.error('[admin] lead update failed', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
};
