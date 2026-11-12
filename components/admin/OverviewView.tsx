'use client';

import { Calculator, Euro, Radio, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Overview } from '@/lib/admin/telemetry';
import { useAdmin } from './AdminShell';
import { Funnel, Gauge, Heatmap, Sparkline, TrendChart } from './charts';
import { useAdminData } from './hooks';
import { Card, CardHeader, Delta, Empty, LiveDot, fmtEur, fmtNum, fmtPct } from './ui';

export type OverviewResponse = { overview: Overview };

export const RANGE_LABEL = { today: 'today', '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days' } as const;

const Kpi = ({ icon, label, value, accent, children }: { icon: ReactNode; label: string; value: string; accent?: boolean; children?: ReactNode }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between text-zinc-500">
      <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      {icon}
    </div>
    <p className={`mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums ${accent ? 'text-[#DC2626]' : 'text-zinc-50'}`}>{value}</p>
    <div className="mt-3 min-h-[36px] text-[11px] text-zinc-500">{children}</div>
  </Card>
);

export const OverviewView = () => {
  const { range } = useAdmin();
  const { data, loading } = useAdminData<OverviewResponse>(`/api/admin/overview?range=${range}`, { pollMs: 15000, signals: ['leads'] });
  const o = data?.overview;

  if (!o) return <Empty>{loading ? 'Loading telemetry…' : 'Telemetry unavailable.'}</Empty>;
  const k = o.kpis;
  const noTraffic = k.pageviews === 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<LiveDot active={k.live > 0} />} label="Live visitors" value={fmtNum(k.live)}>
          {o.livePages.length ? (
            <ul className="space-y-0.5">
              {o.livePages.slice(0, 2).map((p) => (
                <li key={p.page} className="flex justify-between">
                  <span className="truncate">{p.page}</span>
                  <span className="tabular-nums text-zinc-300">{p.visitors}</span>
                </li>
              ))}
            </ul>
          ) : (
            'Nobody browsing right now'
          )}
        </Kpi>
        <Kpi icon={<Users size={14} />} label={`Visits · ${RANGE_LABEL[o.range]}`} value={fmtNum(k.visits)}>
          <div className="flex items-center gap-2">
            <Delta current={k.visits} previous={k.visitsPrev} />
            <span>vs. previous period</span>
          </div>
          <Sparkline values={k.visitsSpark} />
        </Kpi>
        <Kpi icon={<Calculator size={14} />} label="Calculator leads" value={fmtNum(k.quotes)}>
          <span className="tabular-nums">{fmtNum(k.leads)} leads total · {fmtPct(k.conversion)} conversion</span>
        </Kpi>
        <Kpi icon={<Euro size={14} />} label="Quoted pipeline" value={fmtEur(k.pipeline)} accent>
          Midpoint of all calculator ranges · {RANGE_LABEL[o.range]}
        </Kpi>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Visitors · calculator starts · leads"
            hint="Daily, selected range"
            right={
              <div className="flex gap-3 font-mono text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-zinc-200" />Visitors</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-zinc-500" />Calc</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-[#DC2626]" />Leads</span>
              </div>
            }
          />
          <div className="px-2 pb-3 pt-1">{noTraffic && k.leads === 0 ? <Empty>No traffic recorded in this range yet.</Empty> : <TrendChart data={o.trend} />}</div>
        </Card>
        <Card>
          <CardHeader title="Lead conversion efficiency" hint="Calculator submissions ÷ calculator opened" />
          <div className="grid gap-5 p-5">
            <Gauge value={o.efficiency} label="Lead conversion efficiency" />
            <Funnel steps={o.funnel} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Activity consistency" hint="Last 12 weeks · visits + leads (leads weighted ×5)" />
          <div className="overflow-x-auto p-5">
            <Heatmap cells={o.heatmap} />
            <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
              Less
              {[0, 0.3, 0.55, 0.8, 1].map((a) => (
                <span key={a} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: a ? `rgba(220,38,38,${a})` : '#18181b' }} />
              ))}
              More
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Top pages" hint={RANGE_LABEL[o.range]} right={<Radio size={14} className="text-zinc-600" />} />
          {o.pages.length ? (
            <ul className="divide-y divide-zinc-800/80">
              {o.pages.slice(0, 6).map((p) => (
                <li key={p.page} className="flex items-center justify-between px-5 py-2.5 text-[12px]">
                  <span className="truncate text-zinc-300">{p.page}</span>
                  <span className="tabular-nums text-zinc-100">{fmtNum(p.views)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No page views yet.</Empty>
          )}
        </Card>
      </div>
    </div>
  );
};
