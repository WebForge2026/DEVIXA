'use client';

import { useAdmin } from './AdminShell';
import { DailyBars, Heatmap } from './charts';
import { useAdminData } from './hooks';
import { RANGE_LABEL, type OverviewResponse } from './OverviewView';
import { Card, CardHeader, Delta, Empty, LiveDot, fmtNum } from './ui';

const LOCALE_LABEL: Record<string, string> = { de: 'Deutsch', en: 'English', bg: 'Български' };

export const AnalyticsView = () => {
  const { range } = useAdmin();
  const { data, loading } = useAdminData<OverviewResponse>(`/api/admin/overview?range=${range}`, { pollMs: 10000 });
  const o = data?.overview;
  if (!o) return <Empty>{loading ? 'Loading analytics…' : 'Analytics unavailable.'}</Empty>;
  const k = o.kpis;
  const totalLocale = o.locales.reduce((s, l) => s + l.views, 0);

  const stats = [
    { label: 'Live now', value: fmtNum(k.live), extra: <LiveDot active={k.live > 0} /> },
    { label: 'Visits', value: fmtNum(k.visits), extra: <Delta current={k.visits} previous={k.visitsPrev} /> },
    { label: 'Page views', value: fmtNum(k.pageviews), extra: null },
    { label: 'Pages / visit', value: k.visits ? (k.pageviews / k.visits).toFixed(1).replace('.', ',') : '0', extra: null },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-end justify-between p-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{s.label}</p>
              <p className="mt-2 text-[26px] font-semibold leading-none tabular-nums text-zinc-50">{s.value}</p>
            </div>
            {s.extra}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Daily traffic" hint={`Page views, calculator starts and leads · ${RANGE_LABEL[o.range]}`} />
          <div className="px-2 pb-3 pt-1">{k.pageviews === 0 ? <Empty>No traffic recorded in this range yet.</Empty> : <DailyBars data={o.trend} />}</div>
        </Card>
        <Card>
          <CardHeader title="Real-time visitors" hint="Heartbeat within the last 60 seconds" right={<LiveDot active={k.live > 0} />} />
          {o.livePages.length ? (
            <ul className="divide-y divide-zinc-800/80">
              {o.livePages.map((p) => (
                <li key={p.page} className="flex items-center justify-between px-5 py-2.5 text-[12px]">
                  <span className="truncate text-zinc-300">{p.page}</span>
                  <span className="tabular-nums text-zinc-100">{p.visitors}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nobody on the site right now. This list refreshes every few seconds.</Empty>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Pages" hint={RANGE_LABEL[o.range]} />
          {o.pages.length ? (
            <table className="w-full text-[12px]">
              <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <tr className="border-b border-zinc-800/80">
                  <th className="px-5 py-2 font-normal">Page</th>
                  <th className="px-5 py-2 text-right font-normal">Views</th>
                  <th className="px-5 py-2 text-right font-normal">Visits</th>
                  <th className="w-1/3 px-5 py-2 font-normal" aria-label="Share" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {o.pages.map((p) => (
                  <tr key={p.page} className="hover:bg-[#18181B]">
                    <td className="px-5 py-2.5 text-zinc-300">{p.page}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-100">{fmtNum(p.views)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-400">{fmtNum(p.visitors)}</td>
                    <td className="px-5 py-2.5">
                      <div className="h-1 rounded-full bg-zinc-800">
                        <div className="h-full rounded-full bg-zinc-400" style={{ width: `${(p.views / (o.pages[0]?.views || 1)) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No page views yet.</Empty>
          )}
        </Card>
        <Card>
          <CardHeader title="Languages" hint="Share of page views" />
          {o.locales.length ? (
            <ul className="space-y-3 p-5">
              {o.locales.map((l) => (
                <li key={l.locale}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-zinc-300">{LOCALE_LABEL[l.locale] ?? l.locale}</span>
                    <span className="tabular-nums text-zinc-100">{Math.round((l.views / totalLocale) * 100)} %</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-[#DC2626]" style={{ width: `${(l.views / totalLocale) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No data yet.</Empty>
          )}
          <div className="border-t border-zinc-800/80 p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">12-week activity</p>
            <div className="overflow-x-auto">
              <Heatmap cells={o.heatmap} />
            </div>
          </div>
        </Card>
      </div>
      <p className="text-[11px] text-zinc-600">
        Visits are counted without cookies: a daily-rotating anonymous hash, so one person on one day is one visit. Visitors with Do Not Track / Global Privacy Control are not counted.
      </p>
    </div>
  );
};
