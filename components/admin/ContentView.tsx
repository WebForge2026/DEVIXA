'use client';

import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAX_SLOT_IMAGES, editableSections, getPath, mediaSlots } from '@/lib/admin/fields';
import { defaultTheme, type ContentState, type MediaItem, type ThemeSettings } from '@/lib/admin/types';
import { bg } from '@/lib/i18n/dictionaries/bg';
import { de } from '@/lib/i18n/dictionaries/de';
import { en } from '@/lib/i18n/dictionaries/en';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { useAdmin } from './AdminShell';
import { api, broadcast, useAdminData } from './hooks';
import { Card, CardHeader, Empty, Pills } from './ui';

const BASE = { de, en, bg } as const;
type Tab = 'texts' | 'media' | 'design';

const ACCENT_PRESETS = [
  { value: '#FF2A2A', label: 'Brand red (default)' },
  { value: '#DC2626', label: 'Crimson' },
  { value: '#E11D48', label: 'Rose crimson' },
  { value: '#C8102E', label: 'Deep crimson' },
];

/** Downscale to ≤ 1600 px and encode as WebP (JPEG fallback) so images stay small enough to store. */
const compressImage = async (file: File): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let url = canvas.toDataURL('image/webp', quality);
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= 1_500_000) return url;
  }
  throw new Error('too large');
};

const sameContent = (a: ContentState | null, b: ContentState | null) => JSON.stringify(a) === JSON.stringify(b);

/* ---------------------------------------------------------------- Texts */

const TextsEditor = ({ draft, setDraft }: { draft: ContentState; setDraft: (c: ContentState) => void }) => {
  const [locale, setLocale] = useState<Locale>('de');
  const [sectionId, setSectionId] = useState(editableSections[0]!.id);
  const section = editableSections.find((s) => s.id === sectionId)!;
  const overrides = draft.texts[locale] ?? {};

  const setField = (path: string, value: string) => {
    const base = String(getPath(BASE[locale], path) ?? '');
    const next = { ...overrides };
    if (value === base || value.trim() === '') delete next[path];
    else next[path] = value;
    setDraft({ ...draft, texts: { ...draft.texts, [locale]: next } });
  };

  const editedIn = (id: string) => editableSections.find((s) => s.id === id)!.fields.filter((f) => overrides[f.path] !== undefined).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <Card className="h-fit p-2">
        <nav aria-label="Sections">
          {editableSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              aria-current={s.id === sectionId ? 'true' : undefined}
              className={cn('flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px]', s.id === sectionId ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-[#18181B] hover:text-zinc-100')}
            >
              {s.label}
              {editedIn(s.id) ? <span className="rounded bg-amber-500/15 px-1.5 text-[10px] tabular-nums text-amber-300">{editedIn(s.id)}</span> : null}
            </button>
          ))}
        </nav>
      </Card>
      <Card>
        <CardHeader
          title={section.label}
          hint="Empty or unchanged fields use the built-in text."
          right={
            <Pills
              label="Language"
              value={locale}
              onChange={setLocale}
              options={[
                { value: 'de', label: 'DE' },
                { value: 'en', label: 'EN' },
                { value: 'bg', label: 'BG' },
              ]}
            />
          }
        />
        <div className="space-y-5 p-5">
          {section.fields.map((field) => {
            const base = String(getPath(BASE[locale], field.path) ?? '');
            const edited = overrides[field.path] !== undefined;
            const value = overrides[field.path] ?? base;
            const id = `field-${field.path}`;
            const common = {
              id,
              value,
              lang: locale,
              onChange: (e: { target: { value: string } }) => setField(field.path, e.target.value),
              className: cn(
                'w-full rounded-md border bg-[#0c0c0f] px-3 py-2 text-[13px] text-zinc-100 focus:outline-none',
                edited ? 'border-amber-500/40 focus:border-amber-400/70' : 'border-zinc-800 focus:border-zinc-600',
              ),
            };
            return (
              <div key={field.path}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor={id} className="text-[12px] text-zinc-400">
                    {field.label} {edited ? <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-300">edited</span> : null}
                  </label>
                  {edited ? (
                    <button type="button" onClick={() => setField(field.path, base)} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-200">
                      <RotateCcw size={11} /> Default
                    </button>
                  ) : null}
                </div>
                {field.multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

/* ---------------------------------------------------------------- Media */

const MediaManager = ({ draft, setDraft }: { draft: ContentState; setDraft: (c: ContentState) => void }) => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const pending = useRef<{ slot: string; replaceId?: string } | null>(null);

  const setMedia = (media: MediaItem[]) => setDraft({ ...draft, media });

  const pick = (slot: string, replaceId?: string) => {
    pending.current = { slot, replaceId };
    inputs.current[slot]?.click();
  };

  const onFile = async (file: File | undefined) => {
    const target = pending.current;
    if (!file || !target) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    setError(null);
    setBusy(target.slot);
    try {
      const src = await compressImage(file);
      const now = new Date().toISOString();
      if (target.replaceId) setMedia(draft.media.map((m) => (m.id === target.replaceId ? { ...m, src, updatedAt: now } : m)));
      else setMedia([...draft.media, { id: crypto.randomUUID(), slot: target.slot, src, alt: '', updatedAt: now }]);
    } catch {
      setError('This image could not be processed or is too large.');
    } finally {
      setBusy(null);
    }
  };

  const move = (item: MediaItem, dir: -1 | 1) => {
    const inSlot = draft.media.filter((m) => m.slot === item.slot);
    const others = draft.media.filter((m) => m.slot !== item.slot);
    const i = inSlot.findIndex((m) => m.id === item.id);
    const j = i + dir;
    if (j < 0 || j >= inSlot.length) return;
    [inSlot[i], inSlot[j]] = [inSlot[j]!, inSlot[i]!];
    setMedia([...others, ...inSlot]);
  };

  return (
    <div className="space-y-5">
      {error ? <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-[12px] text-red-200">{error}</p> : null}
      {mediaSlots.map((slot) => {
        const items = draft.media.filter((m) => m.slot === slot.id);
        return (
          <Card key={slot.id}>
            <CardHeader
              title={slot.label}
              hint={`Shown on the project card. First image = large cover, up to ${MAX_SLOT_IMAGES} images. No images = card stays text-only.`}
              right={
                <button
                  type="button"
                  disabled={items.length >= MAX_SLOT_IMAGES || busy === slot.id}
                  onClick={() => pick(slot.id)}
                  className="flex items-center gap-1.5 rounded-md bg-[#DC2626] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-500 disabled:opacity-40"
                >
                  <ImagePlus size={13} /> {busy === slot.id ? 'Processing…' : 'Add image'}
                </button>
              }
            />
            <input
              ref={(el) => {
                inputs.current[slot.id] = el;
              }}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {items.length ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item, i) => (
                  <figure key={item.id} className="overflow-hidden rounded-md border border-zinc-800 bg-[#0c0c0f]">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview */}
                      <img src={item.src} alt={item.alt || slot.label} className="aspect-video w-full object-cover" />
                      {i === 0 ? <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">Cover</span> : null}
                    </div>
                    <figcaption className="space-y-2 p-3">
                      <label className="block text-[11px] text-zinc-500">
                        Alt text (for screen readers & Google)
                        <input
                          value={item.alt}
                          maxLength={200}
                          onChange={(e) => setMedia(draft.media.map((m) => (m.id === item.id ? { ...m, alt: e.target.value } : m)))}
                          className="mt-1 w-full rounded border border-zinc-800 bg-[#111114] px-2 py-1.5 text-[12px] text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        />
                      </label>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(item, -1)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30">
                            <ArrowLeft size={13} />
                          </button>
                          <button type="button" aria-label="Move right" disabled={i === items.length - 1} onClick={() => move(item, 1)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30">
                            <ArrowRight size={13} />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => pick(slot.id, item.id)} className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
                            <Upload size={12} /> Replace
                          </button>
                          <button type="button" onClick={() => setMedia(draft.media.filter((m) => m.id !== item.id))} className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <Empty>No images — this project card shows text only.</Empty>
            )}
          </Card>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- Design */

const Slider = ({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) => (
  <label className="block">
    <span className="mb-2 flex justify-between text-[12px] text-zinc-400">
      {label}
      <span className="font-mono tabular-nums text-zinc-100">{format(value)}</span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#DC2626]" />
  </label>
);

const DesignEditor = ({ draft, setDraft }: { draft: ContentState; setDraft: (c: ContentState) => void }) => {
  const t = draft.theme;
  const set = (patch: Partial<ThemeSettings>) => setDraft({ ...draft, theme: { ...t, ...patch } });
  const isDefault = JSON.stringify(t) === JSON.stringify(defaultTheme);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader
          title="Frame & accent settings"
          hint="Applies to the public site after publishing. Defaults reproduce the original design."
          right={
            <button type="button" disabled={isDefault} onClick={() => set({ ...defaultTheme })} className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-200 hover:border-zinc-500 disabled:opacity-40">
              <RotateCcw size={12} /> Reset to default
            </button>
          }
        />
        <div className="space-y-6 p-5">
          <fieldset>
            <legend className="mb-2 text-[12px] text-zinc-400">Accent colour (buttons, labels, highlights)</legend>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set({ accent: p.value })}
                  aria-pressed={t.accent.toLowerCase() === p.value.toLowerCase()}
                  title={p.label}
                  className={cn('flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]', t.accent.toLowerCase() === p.value.toLowerCase() ? 'border-zinc-400 text-white' : 'border-zinc-800 text-zinc-400 hover:text-zinc-100')}
                >
                  <span className="h-3.5 w-3.5 rounded-sm" style={{ background: p.value }} />
                  {p.label}
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-md border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">
                Custom
                <input type="color" value={t.accent} onChange={(e) => set({ accent: e.target.value.toUpperCase() })} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
              </label>
            </div>
          </fieldset>
          <Slider label="Card corner radius" value={t.cardRadius} min={0} max={24} step={1} format={(v) => `${v} px`} onChange={(cardRadius) => set({ cardRadius })} />
          <Slider label="Card spotlight glow" value={t.glow} min={0} max={0.4} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={(glow) => set({ glow })} />
          <Slider label="Red keys on the 3D sphere" value={t.sphereRed} min={0.05} max={0.45} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={(sphereRed) => set({ sphereRed })} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Preview" hint="Approximation of a service card on the dark sections" />
        <div className="p-5">
          <div className="relative overflow-hidden border border-white/15 bg-[#0a0a0d] p-5" style={{ borderRadius: t.cardRadius }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(260px circle at 70% 20%, ${t.accent}${Math.round(t.glow * 255).toString(16).padStart(2, '0')}, transparent 60%)` }} />
            <p className="relative font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: t.accent }}>01 · Digitize processes</p>
            <p className="relative mt-4 text-lg font-black uppercase tracking-tight text-zinc-50">Custom web systems</p>
            <p className="relative mt-2 text-[12px] text-zinc-400">Standard software covers the standard.</p>
            <span className="relative mt-5 inline-block px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-black" style={{ background: t.accent }}>
              Start a project
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1" aria-label="Sphere key mix">
            {Array.from({ length: 40 }, (_, i) => (
              <span key={i} className="h-4 w-4 rounded-[3px]" style={{ background: (i * 7919) % 100 < t.sphereRed * 100 ? '#DC2626' : i % 23 === 0 ? '#d6d9df' : '#1c1d21' }} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ---------------------------------------------------------------- View */

export const ContentView = () => {
  const { setPublish } = useAdmin();
  const { data, reload } = useAdminData<{ content: ContentState }>('/api/admin/content', { signals: ['content'] });
  const [saved, setSaved] = useState<ContentState | null>(null);
  const [draft, setDraftState] = useState<ContentState | null>(null);
  const [tab, setTab] = useState<Tab>('texts');
  const [message, setMessage] = useState<string | null>(null);
  const dirty = useMemo(() => !sameContent(saved, draft), [saved, draft]);

  // Adopt server state when it arrives (or another tab published), unless there are local edits.
  useEffect(() => {
    if (!data) return;
    setSaved(data.content);
    setDraftState((current) => (current && !sameContent(current, saved) ? current : data.content));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new server data
  }, [data]);

  useEffect(() => {
    if (!saved) return;
    setPublish(dirty ? { state: 'dirty', updatedAt: saved.updatedAt } : { state: 'live', updatedAt: saved.updatedAt });
  }, [dirty, saved, setPublish]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setDraft = useCallback((c: ContentState) => setDraftState(c), []);

  const publish = async () => {
    if (!draft) return;
    setPublish({ state: 'saving', updatedAt: saved?.updatedAt ?? null });
    setMessage(null);
    try {
      const { updatedAt } = await api<{ updatedAt: string }>('/api/admin/content', { method: 'PUT', body: JSON.stringify(draft) });
      const next = { ...draft, updatedAt };
      setSaved(next);
      setDraftState(next);
      setPublish({ state: 'live', updatedAt });
      broadcast('content');
      setMessage('Published. The live site updates within a few seconds.');
    } catch {
      setPublish({ state: 'error', updatedAt: saved?.updatedAt ?? null });
      setMessage('Publishing failed. Please try again.');
    }
  };

  if (!draft) return <Empty>Loading content…</Empty>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills
          label="CMS section"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'texts', label: 'Texts' },
            { value: 'media', label: 'Images' },
            { value: 'design', label: 'Design' },
          ]}
        />
        <div className="flex items-center gap-3">
          {message ? <span role="status" className="text-[12px] text-zinc-400">{message}</span> : null}
          <button
            type="button"
            disabled={!dirty}
            onClick={() => {
              setDraftState(saved);
              void reload();
            }}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
          >
            <RefreshCw size={12} /> Discard
          </button>
          <button type="button" disabled={!dirty} onClick={publish} className="rounded-md bg-[#DC2626] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-red-500 disabled:opacity-40">
            Save & publish
          </button>
        </div>
      </div>
      {tab === 'texts' ? <TextsEditor draft={draft} setDraft={setDraft} /> : null}
      {tab === 'media' ? <MediaManager draft={draft} setDraft={setDraft} /> : null}
      {tab === 'design' ? <DesignEditor draft={draft} setDraft={setDraft} /> : null}
    </div>
  );
};
