'use client';

import { ArrowDownUp, Check, Copy, Mail, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { estimateRange, marketRange, type FeatureId, type SystemType, type TimelineId } from '@/lib/estimate';
import { en } from '@/lib/i18n/dictionaries/en';
import { leadStatuses, type Lead, type LeadStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { api, broadcast, useAdminData } from './hooks';
import { Card, Empty, Pills, StatusPill, fmtDate, fmtEur, statusMeta } from './ui';

type StatusFilter = LeadStatus | 'all';
type KindFilter = 'all' | 'quote' | 'contact';
type Sort = 'date' | 'budget';

const label = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? id;
const midpoint = (l: Lead) => (l.priceLow !== null && l.priceHigh !== null ? (l.priceLow + l.priceHigh) / 2 : 0);
const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const displayName = (l: Lead) => l.name ?? l.email.split('@')[0];

const LeadDrawer = ({ lead, onClose, onChange }: { lead: Lead; onClose: () => void; onChange: (lead: Lead) => void }) => {
  const [notes, setNotes] = useState(lead.notes);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => setNotes(lead.notes), [lead.id, lead.notes]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const patch = async (body: { status?: LeadStatus; notes?: string }) => {
    setSaving('saving');
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ kind: lead.kind, ...body }) });
      onChange({ ...lead, ...body });
      broadcast('leads');
      setSaving('saved');
    } catch {
      setSaving('error');
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(lead.email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const cfg = lead.config;
  const features = (cfg?.features ?? []) as FeatureId[];
  const devixa = cfg ? estimateRange(cfg.systemType as SystemType, features, cfg.timeline as TimelineId) : null;
  const market = cfg ? marketRange(cfg.systemType as SystemType, features, cfg.timeline as TimelineId) : null;
  const subject = lead.kind === 'quote' ? 'Ihre Anfrage über den Devixa-Kostenrechner' : 'Ihre Anfrage an Devixa';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Lead ${shortId(lead.id)}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-zinc-800 bg-[#0c0c0f] shadow-2xl">
        <header className="flex items-start justify-between border-b border-zinc-800/80 px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {lead.kind === 'quote' ? 'Calculator quote' : 'Contact enquiry'} · #{shortId(lead.id)}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">{displayName(lead)}</h2>
            <p className="text-[12px] text-zinc-500">{fmtDate(lead.createdAt)}{lead.locale ? ` · ${lead.locale.toUpperCase()}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {leadStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ status: s })}
                  aria-pressed={lead.status === s}
                  className={cn('rounded border px-2 py-1 text-[11px] transition-colors', lead.status === s ? statusMeta[s].className : 'border-zinc-800 text-zinc-500 hover:text-zinc-200')}
                >
                  {statusMeta[s].label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800/80">
            <dl className="divide-y divide-zinc-800/80 text-[13px]">
              {[
                ['Name', lead.name],
                ['Email', lead.email],
                ['Company', lead.company],
                ['Phone', lead.phone],
                ['Project type', lead.projectType],
                ['Budget (stated)', lead.budgetLabel],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 px-4 py-2.5">
                    <dt className="text-zinc-500">{k}</dt>
                    <dd className="text-right text-zinc-100">{v}</dd>
                  </div>
                ))}
            </dl>
            <div className="flex gap-2 border-t border-zinc-800/80 p-3">
              <button type="button" onClick={copy} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-800 py-2 text-[12px] text-zinc-300 hover:border-zinc-700 hover:text-white">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy email'}
              </button>
              <a
                href={`mailto:${lead.email}?subject=${encodeURIComponent(subject)}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#DC2626] py-2 text-[12px] font-medium text-white hover:bg-red-500"
              >
                <Mail size={13} /> Reply via email
              </a>
            </div>
          </section>

          {cfg && devixa && market ? (
            <section>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Calculator configuration</p>
              <div className="rounded-lg border border-zinc-800/80">
                <div className="flex items-baseline justify-between border-b border-zinc-800/80 px-4 py-3">
                  <span className="text-[12px] text-zinc-400">Quoted range</span>
                  <span className="text-xl font-semibold tabular-nums text-[#DC2626]">
                    {fmtEur(lead.priceLow ?? devixa.low)} – {fmtEur(lead.priceHigh ?? devixa.high)}
                  </span>
                </div>
                <dl className="divide-y divide-zinc-800/80 text-[13px]">
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-zinc-500">System type</dt>
                    <dd className="text-zinc-100">{label(en.estimator.systems, cfg.systemType)}</dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-zinc-500">Timeline</dt>
                    <dd className="text-zinc-100">{label(en.estimator.timelines, cfg.timeline)}</dd>
                  </div>
                  <div className="px-4 py-2.5">
                    <dt className="text-zinc-500">Components ({features.length})</dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {features.length ? (
                        features.map((f) => (
                          <span key={f} className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-200">
                            {label(en.estimator.featureOptions, f)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-zinc-600">None selected</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-[12px]">
                    <dt className="text-zinc-500">German agency reference</dt>
                    <dd className="tabular-nums text-zinc-400 line-through decoration-zinc-600">
                      {fmtEur(market.low)} – {fmtEur(market.high)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}

          {lead.message ? (
            <section>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Message</p>
              <p className="whitespace-pre-wrap rounded-lg border border-zinc-800/80 bg-[#111114] p-4 text-[13px] leading-relaxed text-zinc-200">{lead.message}</p>
            </section>
          ) : null}

          <section>
            <label htmlFor="lead-notes" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Internal notes
            </label>
            <textarea
              id="lead-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaving('idle');
              }}
              rows={5}
              maxLength={5000}
              placeholder="Call notes, next steps, quote number…"
              className="w-full resize-y rounded-lg border border-zinc-800 bg-[#111114] p-3 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-3">
              <span className="text-[11px] text-zinc-500" role="status">
                {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : saving === 'error' ? 'Could not save' : notes !== lead.notes ? 'Unsaved' : ''}
              </span>
              <button
                type="button"
                disabled={notes === lead.notes || saving === 'saving'}
                onClick={() => patch({ notes })}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-200 hover:border-zinc-500 disabled:opacity-40"
              >
                Save notes
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export const LeadsView = () => {
  const { data, loading, setData } = useAdminData<{ leads: Lead[] }>('/api/admin/leads', { pollMs: 15000, signals: ['leads'] });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [kind, setKind] = useState<KindFilter>('all');
  const [sort, setSort] = useState<Sort>('date');
  const [openId, setOpenId] = useState<string | null>(null);

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: leads.length, new: 0, contacted: 0, proposal: 0, won: 0, archived: 0 };
    leads.forEach((l) => (c[l.status] += 1));
    return c;
  }, [leads]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => status === 'all' || l.status === status)
      .filter((l) => kind === 'all' || l.kind === kind)
      .filter((l) => !q || [l.name, l.email, l.company, l.projectType, l.message, l.id].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'budget' ? midpoint(b) - midpoint(a) : b.createdAt.localeCompare(a.createdAt)));
  }, [leads, query, status, kind, sort]);

  const open = leads.find((l) => l.id === openId) ?? null;
  const update = (next: Lead) => setData((d) => (d ? { leads: d.leads.map((l) => (l.id === next.id ? next : l)) } : d));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[260px] flex-1">
          <span className="sr-only">Search leads</span>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, message, ID…"
            className="w-full rounded-md border border-zinc-800 bg-[#111114] py-2 pl-9 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </label>
        <Pills
          label="Lead type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: 'All' },
            { value: 'quote', label: 'Calculator' },
            { value: 'contact', label: 'Contact' },
          ]}
        />
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'date' ? 'budget' : 'date'))}
          className="flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:text-zinc-100"
        >
          <ArrowDownUp size={12} /> Sort: {sort === 'date' ? 'Newest' : 'Budget'}
        </button>
      </div>
      <Pills
        label="Status"
        value={status}
        onChange={setStatus}
        options={[{ value: 'all' as StatusFilter, label: 'All', count: counts.all }, ...leadStatuses.map((s) => ({ value: s as StatusFilter, label: statusMeta[s].label, count: counts[s] }))]}
      />

      <Card className="overflow-hidden">
        {rows.length ? (
          <table className="w-full text-[13px]">
            <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <tr className="border-b border-zinc-800/80">
                <th className="px-4 py-2.5 font-normal">ID</th>
                <th className="px-4 py-2.5 font-normal">Received</th>
                <th className="px-4 py-2.5 font-normal">Contact</th>
                <th className="px-4 py-2.5 font-normal">Type</th>
                <th className="px-4 py-2.5 text-right font-normal">Budget</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rows.map((l) => (
                <tr
                  key={l.id}
                  tabIndex={0}
                  onClick={() => setOpenId(l.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpenId(l.id))}
                  className={cn('cursor-pointer transition-colors hover:bg-[#18181B] focus:bg-[#18181B] focus:outline-none', l.status === 'new' && 'bg-red-500/[0.03]')}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                    {l.status === 'new' ? <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#DC2626] align-middle" aria-label="unread" /> : null}#{shortId(l.id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-400">{fmtDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-100">{displayName(l)}</p>
                    <p className="text-[11px] text-zinc-500">{l.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {l.kind === 'quote' ? `Calculator · ${label(en.estimator.systems, l.config?.systemType ?? '')}` : `Contact · ${l.projectType ?? '—'}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {l.priceLow !== null && l.priceHigh !== null ? (
                      <span className="font-semibold text-[#DC2626]">{fmtEur(midpoint(l))}</span>
                    ) : (
                      <span className="text-zinc-500">{l.budgetLabel ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>{loading ? 'Loading leads…' : leads.length ? 'No leads match these filters.' : 'No leads yet. Submissions from the cost calculator and the contact form appear here automatically.'}</Empty>
        )}
      </Card>
      {open ? <LeadDrawer lead={open} onClose={() => setOpenId(null)} onChange={update} /> : null}
    </div>
  );
};
