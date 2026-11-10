'use client';

import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { submitLead, type ActionState } from '@/app/actions/leads';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { site } from '@/lib/site';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { SectionLabel } from '@/components/ui/SectionLabel';

const Submit = ({ idle, busy }: { idle: string; busy: string }) => {
  const { pending } = useFormStatus();
  return (
    <MagneticButton type="submit" variant="crimson" disabled={pending}>
      {pending ? busy : idle} <ArrowUpRight size={14} />
    </MagneticButton>
  );
};

const FieldError = ({ errors }: { errors?: string[] }) =>
  errors?.length ? <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-crimson">{errors[0]}</p> : null;

const CHANNELS = [
  { icon: Mail, label: 'Office', value: site.contact.office, href: `mailto:${site.contact.office}` },
  { icon: Mail, label: 'Support', value: site.contact.support, href: `mailto:${site.contact.support}` },
  { icon: Phone, label: 'DE', value: site.contact.phoneDE.display, href: site.contact.phoneDE.href },
  { icon: Phone, label: 'BG', value: site.contact.phoneBG.display, href: site.contact.phoneBG.href },
];

export const Contact = ({ locale, contact }: { locale: Locale; contact: Dictionary['contact'] }) => {
  const [state, action] = useFormState<ActionState, FormData>(submitLead, { status: 'idle' });
  const errors = state.status === 'error' ? state.fieldErrors : undefined;
  const f = contact.fields;

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative px-4 py-28 md:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionLabel index="06">{contact.label}</SectionLabel>
          <h2 id="contact-title" className="type-display mt-5 text-[clamp(2rem,4.6vw,4.5rem)]">
            {contact.title}
          </h2>
          <p className="mt-5 max-w-md text-fg/70">{contact.intro}</p>
          <ul className="mt-10 border-t border-line/20">
            {CHANNELS.map(({ icon: Icon, label, value, href }) => (
              <li key={href} className="border-b border-line/20">
                <a href={href} className="group flex items-center justify-between gap-4 py-4" data-cursor="lens">
                  <span className="flex items-center gap-4">
                    <Icon size={16} className="text-crimson" />
                    <span className="w-16 font-mono text-[10px] uppercase tracking-[0.25em] text-fg/50">{label}</span>
                    <span className="text-lg font-medium tracking-tight md:text-xl">{value}</span>
                  </span>
                  <ArrowUpRight size={16} className="opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-crimson group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-line/20 bg-panel/80 p-6 backdrop-blur-md md:p-10 lg:col-span-7">
          {state.status === 'success' ? (
            <div role="status" className="flex min-h-[420px] flex-col items-start justify-center gap-6">
              <span className="h-3 w-3 animate-blink bg-crimson shadow-[0_0_14px_#FF2A2A]" />
              <p className="type-display max-w-[18ch] text-3xl">{contact.success}</p>
            </div>
          ) : (
            <form action={action} noValidate className="grid gap-x-8 gap-y-7 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.fullName} *</label>
                <input id="full_name" name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="field" aria-invalid={Boolean(errors?.full_name)} />
                <FieldError errors={errors?.full_name} />
              </div>
              <div>
                <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.email} *</label>
                <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="field" aria-invalid={Boolean(errors?.email)} />
                <FieldError errors={errors?.email} />
              </div>
              <div>
                <label htmlFor="company" className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.company}</label>
                <input id="company" name="company" maxLength={160} autoComplete="organization" className="field" />
              </div>
              <div>
                <label htmlFor="project_type" className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.projectType} *</label>
                <select id="project_type" name="project_type" required defaultValue={contact.projectTypes[0]} className="field appearance-none">
                  {contact.projectTypes.map((type) => (
                    <option key={type} value={type} className="bg-bg text-fg">{type}</option>
                  ))}
                </select>
              </div>
              <fieldset className="md:col-span-2">
                <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.budget} *</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {contact.budgets.map((budget, i) => (
                    <label key={budget} className="cursor-pointer" data-cursor="lens">
                      <input type="radio" name="estimated_budget" value={budget} defaultChecked={i === contact.budgets.length - 1} className="peer sr-only" />
                      <span className="block border border-line/25 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors peer-checked:border-crimson peer-checked:bg-crimson peer-checked:text-obsidian peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-crimson">
                        {budget}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="md:col-span-2">
                <label htmlFor="message" className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">{f.message} *</label>
                <textarea id="message" name="message" required minLength={10} maxLength={5000} rows={5} className="field resize-y" aria-invalid={Boolean(errors?.message)} />
                <FieldError errors={errors?.message} />
              </div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label className="flex items-start gap-3 text-sm text-fg/75 md:col-span-2">
                <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#FF2A2A]" />
                <span>
                  {f.consent}{' '}
                  <Link href={`/${locale}/privacy`} className="underline decoration-crimson underline-offset-4">
                    {f.privacyLink}
                  </Link>
                  <FieldError errors={errors?.consent} />
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-6 md:col-span-2">
                <Submit idle={contact.submit} busy={contact.sending} />
                {state.status === 'error' && state.reason !== 'validation' ? (
                  <p role="alert" className="font-mono text-xs text-crimson">
                    {state.reason === 'config' ? contact.errorConfig : contact.errorGeneric}
                  </p>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
