import { NextResponse, type NextRequest } from 'next/server';
import { noStore, requireAdmin } from '@/lib/admin/session';
import { getStore } from '@/lib/admin/store';
import { buildOverview } from '@/lib/admin/telemetry';
import { ranges, type Range } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const param = request.nextUrl.searchParams.get('range');
  const range: Range = ranges.includes(param as Range) ? (param as Range) : '30d';
  const store = getStore();
  // 180 days covers the 90-day range plus its comparison period and the 12-week heatmap.
  const since = new Date(Date.now() - 181 * 86_400_000);
  const [events, leads, presence] = await Promise.all([store.listEvents(since), store.listLeads(), store.listPresence(new Date(Date.now() - 120_000))]);
  return NextResponse.json(
    { overview: buildOverview(range, events, leads, presence), store: { kind: store.kind, persistent: store.persistent } },
    noStore,
  );
};
