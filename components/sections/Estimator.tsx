'use client';

import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitEstimate, type ActionState } from '@/app/actions/leads';
import { estimateRange, formatEuro, type FeatureId, type SystemType, type TimelineId } from '@/lib/estimate';
import type { Dictionary } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { SectionLabel } from '@/components/ui/SectionLabel';

const SubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();
  return (
    <MagneticButton type="submit" variant="crimson" disabled={pending}>
      {pending ? '…' : label}
    </MagneticButton>
  );
};

type EstimatorProps = { estimator: Dictionary['estimator']; contact: Dictionary['contact']; intlLocale: string };

/** System configurator: live indicative range on the client, authoritative recalculation on the server. */
export const Estimator = ({ estimator, contact, intlLocale }: EstimatorProps) => {
  const [system, setSystem] = useState<SystemType>('business-system');
  const [features, setFeatures] = useState<FeatureId[]>(['dashboard']);
  const [timeline, setTimeline] = useState<TimelineId>('standard');
  const [state, action] = useFormState<ActionState, FormData>(submitEstimate, { status: 'idle' });

  const range = useMemo(() => estimateRange(system, features, timeline), [system, features, timeline]);
  const toggle = (id: FeatureId) => setFeatures((list) => (list.includes(id) ? list.filter((f) => f !== id) : [...list, id]));

  const chip = (on: boolean) =>
    cn(
      'flex items-center gap-2 border px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.15em] transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97]',
      on ? 'border-crimson bg-crimson text-obsidian' : 'border-line/25 hover:border-fg',
    );

  return (
    <section id="estimate" aria-labelledby="estimate-title" className="relative px-4 py-28 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <SectionLabel index="04">{estimator.label}</SectionLabel>
        <h2 id="estimate-title" className="type-display mt-5 text-[clamp(1.8rem,4vw,4rem)]">
          {estimator.title}
        </h2>
        <p className="mt-4 max-w-xl text-fg/70">{estimator.intro}</p>

        <form action={action} className="mt-12 grid gap-px border border-line/20 bg-line/20 lg:grid-cols-12">
          <div className="space-y-10 bg-panel/80 p-6 backdrop-blur-md md:p-10 lg:col-span-7">
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">A · {estimator.systemType}</legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {estimator.systems.map((option) => (
                  <label key={option.id} className={chip(system === option.id)} data-cursor="lens">
                    <input type="radio" name="system_type" value={option.id} checked={system === option.id} onChange={() => setSystem(option.id as SystemType)} className="sr-only" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">B · {estimator.features}</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {estimator.featureOptions.map((option) => {
                  const on = features.includes(option.id as FeatureId);
                  return (
                    <label key={option.id} className={chip(on)} data-cursor="lens">
                      <input type="checkbox" name="features" value={option.id} checked={on} onChange={() => toggle(option.id as FeatureId)} className="sr-only" />
                      <span className={cn('grid h-3.5 w-3.5 place-items-center border', on ? 'border-obsidian' : 'border-current')}>{on ? <Check size={10} strokeWidth={3} /> : null}</span>
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">C · {estimator.timeline}</legend>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {estimator.timelines.map((option) => (
                  <label key={option.id} className={cn(chip(timeline === option.id), 'justify-center')} data-cursor="lens">
                    <input type="radio" name="timeline" value={option.id} checked={timeline === option.id} onChange={() => setTimeline(option.id as TimelineId)} className="sr-only" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden bg-obsidian p-6 text-[#EEEEF2] md:p-10 lg:col-span-5">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(255,42,42,0.28),transparent_70%)]" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#EEEEF2]/60">{estimator.result}</p>
              <p className="type-display mt-4 text-[clamp(2rem,4.2vw,3.75rem)] tabular-nums" aria-live="polite">
                {formatEuro(range.low, intlLocale)}
                <span className="block text-crimson">— {formatEuro(range.high, intlLocale)}</span>
              </p>
              <p className="mt-4 max-w-sm text-sm text-[#EEEEF2]/60">{estimator.disclaimer}</p>
            </div>

            <div className="relative mt-10">
              {state.status === 'success' ? (
                <p role="status" className="border border-crimson p-4 font-mono text-xs uppercase tracking-[0.15em] text-crimson">
                  {estimator.success}
                </p>
              ) : (
                <>
                  <label htmlFor="estimate-email" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#EEEEF2]/60">
                    {estimator.email}
                  </label>
                  <input id="estimate-email" name="contact_email" type="email" required autoComplete="email" placeholder="you@company.com" className="field mt-2 border-white/30 text-[#EEEEF2]" />
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                  <div className="mt-6">
                    <SubmitButton label={estimator.submit} />
                  </div>
                  {state.status === 'error' ? (
                    <p role="alert" className="mt-4 font-mono text-xs text-crimson">
                      {state.reason === 'config' ? contact.errorConfig : contact.errorGeneric}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
