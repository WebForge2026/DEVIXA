'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FunnelStep, HeatCell, TrendPoint } from '@/lib/admin/telemetry';
import { ACCENT, fmtDay, fmtNum } from './ui';

const axis = { stroke: '#3f3f46', fontSize: 10, tickLine: false, axisLine: false } as const;

const TooltipBox = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) =>
  active && payload?.length ? (
    <div className="rounded-md border border-zinc-800 bg-[#0c0c0f]/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur">
      <p className="mb-1 font-mono text-zinc-400">{label ? fmtDay(label) : ''}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center justify-between gap-6 tabular-nums">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-zinc-100">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  ) : null;

/** Daily visitors vs. calculator starts vs. submitted leads. */
export const TrendChart = ({ data }: { data: TrendPoint[] }) => (
  <ResponsiveContainer width="100%" height={260} className="animate-[fadeIn_0.6s_ease-out]">
    <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
      <CartesianGrid stroke="#27272a" strokeDasharray="2 4" vertical={false} />
      <XAxis dataKey="day" tickFormatter={fmtDay} {...axis} minTickGap={24} />
      <YAxis allowDecimals={false} {...axis} width={40} />
      <Tooltip content={<TooltipBox />} cursor={{ stroke: '#3f3f46' }} />
      <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#e4e4e7" strokeWidth={2} dot={false} isAnimationActive={false} />
      <Line type="monotone" dataKey="calcStarts" name="Calculator starts" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
      <Line type="monotone" dataKey="leads" name="Leads" stroke={ACCENT} strokeWidth={2.25} dot={{ r: 2.5, fill: ACCENT, strokeWidth: 0 }} isAnimationActive={false} />
    </LineChart>
  </ResponsiveContainer>
);

/** Stacked daily traffic: page views split into normal views and calculator interactions. */
export const DailyBars = ({ data }: { data: TrendPoint[] }) => (
  <ResponsiveContainer width="100%" height={240} className="animate-[fadeIn_0.6s_ease-out]">
    <BarChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
      <CartesianGrid stroke="#27272a" strokeDasharray="2 4" vertical={false} />
      <XAxis dataKey="day" tickFormatter={fmtDay} {...axis} minTickGap={24} />
      <YAxis allowDecimals={false} {...axis} width={40} />
      <Tooltip content={<TooltipBox />} cursor={{ fill: '#18181b' }} />
      <Bar dataKey="pageviews" name="Page views" stackId="a" fill="#3f3f46" isAnimationActive={false} />
      <Bar dataKey="calcStarts" name="Calculator starts" stackId="a" fill="#a1a1aa" isAnimationActive={false} />
      <Bar dataKey="leads" name="Leads" stackId="a" fill={ACCENT} radius={[2, 2, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ResponsiveContainer>
);

export const Sparkline = ({ values }: { values: number[] }) => (
  <ResponsiveContainer width="100%" height={36}>
    <AreaChart data={values.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={1.5} fill="url(#spark)" isAnimationActive={false} />
    </AreaChart>
  </ResponsiveContainer>
);

/** Radial 0–100 score gauge (270° arc). */
export const Gauge = ({ value, label }: { value: number; label: string }) => {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.75;
  const filled = arc * (Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative mx-auto h-[148px] w-[148px]">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[225deg]" role="img" aria-label={`${label}: ${value} / 100`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#27272a" strokeWidth="10" strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={ACCENT}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-zinc-50">{value}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">/ 100</span>
      </div>
    </div>
  );
};

export const Funnel = ({ steps }: { steps: FunnelStep[] }) => {
  const max = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const previous = i > 0 ? steps[i - 1]!.value : null;
        const rate = previous ? (step.value / previous) * 100 : null;
        return (
          <li key={step.key}>
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="text-zinc-300">{step.label}</span>
              <span className="tabular-nums text-zinc-100">
                {fmtNum(step.value)}
                {rate !== null ? <span className="ml-2 font-mono text-[10px] text-zinc-500">{rate.toFixed(0)}%</span> : null}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${(step.value / max) * 100}%`, background: i === steps.length - 1 ? ACCENT : '#a1a1aa' }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};

/** 12-week consistency matrix (columns = weeks, rows = Mon…Sun), shaded by visits + weighted leads. */
export const Heatmap = ({ cells }: { cells: HeatCell[] }) => {
  // Pad the start so the first column begins on a Monday.
  const firstDow = (new Date(`${cells[0]?.day ?? '2026-01-05'}T00:00:00`).getDay() + 6) % 7;
  const padded: (HeatCell | null)[] = [...Array.from({ length: firstDow }, () => null), ...cells];
  const weeks: (HeatCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  return (
    <div className="flex items-start gap-3">
      <div className="mt-[1px] grid grid-rows-7 gap-[3px] font-mono text-[9px] leading-[14px] text-zinc-600">
        {['Mo', '', 'Mi', '', 'Fr', '', 'So'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="flex gap-[3px]" role="img" aria-label="Traffic activity, last 12 weeks">
        {weeks.map((week, w) => (
          <div key={w} className="grid grid-rows-7 gap-[3px]">
            {Array.from({ length: 7 }, (_, d) => {
              const cell = week[d];
              if (!cell) return <span key={d} className="h-[14px] w-[14px]" />;
              const alpha = cell.score === 0 ? 0 : 0.18 + cell.score * 0.82;
              return (
                <span
                  key={d}
                  title={`${fmtDay(cell.day)} · ${cell.visits} visits · ${cell.leads} leads`}
                  className="h-[14px] w-[14px] rounded-[3px] border border-zinc-800/60"
                  style={{ background: alpha ? `rgba(220,38,38,${alpha.toFixed(2)})` : '#18181b' }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
