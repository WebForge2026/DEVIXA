'use client';

import type { ReactNode } from 'react';
import type { LeadStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export const ACCENT = '#DC2626';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const numFormat = new Intl.NumberFormat('de-DE');
export const fmtEur = (v: number) => eurFormat.format(Math.round(v));
export const fmtNum = (v: number) => numFormat.format(v);
export const fmtPct = (v: number, digits = 1) => `${v.toFixed(digits).replace('.', ',')} %`;
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
export const fmtDay = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-zinc-800/80 bg-[#111114]', className)}>{children}</section>
);

export const CardHeader = ({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) => (
  <header className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-5 py-3.5">
    <div>
      <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">{title}</h2>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
    {right}
  </header>
);

export const Pills = <T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-zinc-800/80 bg-[#0c0c0f] p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={o.value === value}
        onClick={() => onChange(o.value)}
        className={cn(
          'flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors',
          o.value === value ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200',
        )}
      >
        {o.label}
        {o.count !== undefined ? <span className="tabular-nums text-zinc-500">{o.count}</span> : null}
      </button>
    ))}
  </div>
);

export const statusMeta: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'border-red-500/40 bg-red-500/10 text-red-300' },
  contacted: { label: 'Contacted', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  proposal: { label: 'Proposal sent', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  won: { label: 'Won', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  archived: { label: 'Archived', className: 'border-zinc-700 bg-zinc-800/50 text-zinc-400' },
};

export const StatusPill = ({ status }: { status: LeadStatus }) => (
  <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium', statusMeta[status].className)}>
    {statusMeta[status].label}
  </span>
);

export const Delta = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0) return <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{current > 0 ? 'NEW' : '—'}</span>;
  const delta = ((current - previous) / previous) * 100;
  const up = delta >= 0;
  return (
    <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums', up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
      {up ? '+' : ''}
      {delta.toFixed(1).replace('.', ',')}%
    </span>
  );
};

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-[120px] items-center justify-center px-6 py-8 text-center text-[12px] text-zinc-500">{children}</div>
);

export const LiveDot = ({ active = true }: { active?: boolean }) => (
  <span className="relative inline-flex h-2 w-2" aria-hidden>
    {active ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /> : null}
    <span className={cn('relative inline-flex h-2 w-2 rounded-full', active ? 'bg-emerald-400' : 'bg-zinc-600')} />
  </span>
);
