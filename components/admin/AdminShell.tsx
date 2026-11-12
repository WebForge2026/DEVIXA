'use client';

import { Activity, AlertTriangle, ArrowUpRight, Inbox, LayoutDashboard, LogOut, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lead, Range } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { DxMark } from '@/components/ui/Wordmark';
import { api, useAdminData } from './hooks';
import { LiveDot, Pills, fmtNum } from './ui';

type PublishState = { state: 'live' | 'dirty' | 'saving' | 'error'; updatedAt: string | null };
type StoreInfo = { kind: 'supabase' | 'file'; persistent: boolean };

type AdminContextValue = {
  range: Range;
  setRange: (range: Range) => void;
  publish: PublishState;
  setPublish: (publish: PublishState) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminShell>');
  return ctx;
};

const NAV = [
  { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Live Analytics', icon: Activity },
  { href: '/admin/leads', label: 'Leads & Quotes', icon: Inbox },
  { href: '/admin/content', label: 'Content & Media CMS', icon: PenSquare },
] as const;

const TITLES: Record<string, { title: string; subtitle: string; ranged: boolean }> = {
  '/admin': { title: 'Command Center', subtitle: 'Live website telemetry & lead operations', ranged: true },
  '/admin/analytics': { title: 'Live Analytics', subtitle: 'Traffic, real-time visitors & activity', ranged: true },
  '/admin/leads': { title: 'Leads & Quotes', subtitle: 'Calculator submissions and contact enquiries', ranged: false },
  '/admin/content': { title: 'Content & Media CMS', subtitle: 'Texts, images and design of the public website', ranged: false },
};

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

const LiveUsersCard = ({ live, pages }: { live: number; pages: { page: string; visitors: number }[] }) => (
  <div className="rounded-lg border border-zinc-800/80 bg-[#111114] p-3.5">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Active now</span>
      <LiveDot active={live > 0} />
    </div>
    <p className="mt-1.5 text-2xl font-semibold tabular-nums text-zinc-50">{fmtNum(live)}</p>
    <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
      {pages.slice(0, 3).map((p) => (
        <li key={p.page} className="flex justify-between gap-2">
          <span className="truncate">{p.page}</span>
          <span className="tabular-nums text-zinc-300">{p.visitors}</span>
        </li>
      ))}
      {pages.length === 0 ? <li className="text-zinc-600">No one on the site right now</li> : null}
    </ul>
    <a href="/" target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white">
      View live site <ArrowUpRight size={12} />
    </a>
  </div>
);

const PublishBadge = ({ publish }: { publish: PublishState }) => {
  const meta = {
    live: { label: publish.updatedAt ? `Published · ${new Date(publish.updatedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Live · defaults', className: 'border-emerald-500/30 text-emerald-300' },
    dirty: { label: 'Unpublished changes', className: 'border-amber-500/40 text-amber-300' },
    saving: { label: 'Publishing…', className: 'border-sky-500/30 text-sky-300' },
    error: { label: 'Publish failed', className: 'border-red-500/40 text-red-300' },
  }[publish.state];
  return <span className={cn('rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', meta.className)}>{meta.label}</span>;
};

export const AdminShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [range, setRange] = useState<Range>('30d');
  const [publish, setPublish] = useState<PublishState>({ state: 'live', updatedAt: null });
  const live = useAdminData<{ live: number; pages: { page: string; visitors: number }[]; store: StoreInfo }>('/api/admin/live', { pollMs: 5000 });
  const leads = useAdminData<{ leads: Lead[] }>('/api/admin/leads', { pollMs: 20000, signals: ['leads'] });
  const unread = leads.data?.leads.filter((l) => l.status === 'new').length ?? 0;
  const meta = TITLES[pathname] ?? TITLES['/admin']!;
  const store = live.data?.store;

  // Show when the live content was last published (the CMS view updates this while editing).
  useEffect(() => {
    api<{ content: { updatedAt: string | null } }>('/api/admin/content')
      .then(({ content }) => setPublish((p) => (p.state === 'live' ? { state: 'live', updatedAt: content.updatedAt } : p)))
      .catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ range, setRange, publish, setPublish }), [range, publish]);

  const logout = async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/admin/login';
  };

  return (
    <AdminContext.Provider value={value}>
      <div className="min-h-screen bg-[#09090B] text-zinc-200">
        <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r border-zinc-800/80 bg-[#09090B]">
          <div className="border-b border-zinc-800/80 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <DxMark id="dx-admin" className="h-5 text-zinc-50" />
              <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-red-300">Command Center</span>
            </div>
            <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              <LiveDot /> System online
            </p>
          </div>
          <nav aria-label="Admin" className="flex-1 space-y-0.5 px-3 py-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                    active ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:bg-[#18181B] hover:text-zinc-100',
                  )}
                >
                  <Icon size={15} className={active ? 'text-red-400' : ''} />
                  <span className="flex-1">{label}</span>
                  {href === '/admin/leads' && unread > 0 ? (
                    <span className="rounded-full bg-[#DC2626] px-1.5 text-[10px] font-semibold tabular-nums text-white" aria-label={`${unread} new leads`}>
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 p-3">
            <LiveUsersCard live={live.data?.live ?? 0} pages={live.data?.pages ?? []} />
            <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-[12px] text-zinc-500 transition-colors hover:bg-[#18181B] hover:text-zinc-200">
              <LogOut size={13} /> Log out
            </button>
          </div>
        </aside>

        <div className="pl-[240px]">
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 bg-[#09090B]/90 px-8 py-4 backdrop-blur">
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-zinc-50">{meta.title}</h1>
              <p className="text-[12px] text-zinc-500">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {meta.ranged ? <Pills label="Date range" value={range} options={RANGE_OPTIONS} onChange={setRange} /> : null}
              <PublishBadge publish={publish} />
            </div>
          </header>
          {store && !store.persistent ? (
            <div className="mx-8 mt-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[12px] text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                No database connected: data is kept in temporary server storage and can be lost at any time. Set <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> and run{' '}
                <code className="font-mono">supabase/schema.sql</code> to store leads, statistics and content permanently.
              </p>
            </div>
          ) : null}
          <main className="px-8 py-6">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
};
