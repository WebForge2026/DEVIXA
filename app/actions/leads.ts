'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { estimateRange, featureIds, systemTypes, timelineIds } from '@/lib/estimate';
import { getStore } from '@/lib/admin/store';
import type { NewLead } from '@/lib/admin/types';
import { isLocale } from '@/lib/i18n/config';
import { isServiceRoleConfigured } from '@/lib/supabase/admin';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; reason: 'validation' | 'config' | 'server' | 'rate'; fieldErrors?: Record<string, string[] | undefined> };

const trimmed = (max: number) => z.string().trim().max(max);

const leadSchema = z.object({
  full_name: trimmed(120).min(2),
  email: trimmed(254).email(),
  company: trimmed(160).optional().default(''),
  project_type: trimmed(80).min(1),
  estimated_budget: trimmed(40).min(1),
  message: trimmed(5000).min(10),
  consent: z.literal('on'),
});

const estimateSchema = z.object({
  system_type: z.enum(systemTypes),
  features: z.array(z.enum(featureIds)).max(featureIds.length),
  timeline: z.enum(timelineIds),
  contact_email: trimmed(254).email(),
});

// Per-instance sliding window: 5 submissions per IP per 10 minutes.
// Stops casual abuse; put a shared limiter (e.g. Upstash, Supabase) in front for multi-instance hosting.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

const isRateLimited = () => {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || headers().get('x-real-ip') || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
};

const readLocale = (formData: FormData) => {
  const value = String(formData.get('locale') ?? '');
  return isLocale(value) ? value : null;
};

/**
 * Saves a lead so it appears in the admin CRM.
 * - Supabase service role configured → admin store (Supabase).
 * - Local development without Supabase → admin store (JSON file in .data/).
 * - Only the public anon key configured → direct insert (RLS: insert-only), as before.
 * - Nothing configured on a serverless host → "not connected", so no lead is silently lost.
 */
const persistLead = async (lead: NewLead, anonInsert: () => Promise<{ error: { code?: string; message: string } | null }>) => {
  try {
    if (isServiceRoleConfigured() || !process.env.VERCEL) {
      await getStore().createLead(lead);
      return 'ok' as const;
    }
    if (isSupabaseConfigured()) {
      const { error } = await anonInsert();
      if (error) throw new Error(`${error.code ?? ''} ${error.message}`);
      return 'ok' as const;
    }
    return 'config' as const;
  } catch (error) {
    console.error('[leads] save failed', error);
    return 'server' as const;
  }
};

/** Bots fill every field; humans never see this one. */
const isBot = (formData: FormData) => String(formData.get('website') ?? '').length > 0;

export const submitLead = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  if (isBot(formData)) return { status: 'success' };

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: 'error', reason: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (isRateLimited()) return { status: 'error', reason: 'rate' };

  const { consent: _consent, ...lead } = parsed.data;
  const locale = readLocale(formData);
  const result = await persistLead(
    {
      kind: 'contact',
      name: lead.full_name,
      email: lead.email,
      company: lead.company || null,
      phone: null,
      priceLow: null,
      priceHigh: null,
      budgetLabel: lead.estimated_budget,
      projectType: lead.project_type,
      message: lead.message,
      config: null,
      locale,
    },
    async () => await createClient().from('leads').insert({ ...lead, locale }),
  );
  return result === 'ok' ? { status: 'success' } : { status: 'error', reason: result };
};

export const submitEstimate = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  if (isBot(formData)) return { status: 'success' };

  const parsed = estimateSchema.safeParse({
    system_type: formData.get('system_type'),
    features: formData.getAll('features'),
    timeline: formData.get('timeline'),
    contact_email: formData.get('contact_email'),
  });
  if (!parsed.success) {
    return { status: 'error', reason: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (isRateLimited()) return { status: 'error', reason: 'rate' };

  const { system_type, features, timeline, contact_email } = parsed.data;
  // Recalculate server-side: the client preview is never trusted.
  const { low, high } = estimateRange(system_type, features, timeline);
  const locale = readLocale(formData);

  const result = await persistLead(
    {
      kind: 'quote',
      name: null,
      email: contact_email,
      company: null,
      phone: null,
      priceLow: low,
      priceHigh: high,
      budgetLabel: null,
      projectType: null,
      message: null,
      config: { systemType: system_type, features, timeline },
      locale,
    },
    async () =>
      await createClient()
        .from('project_estimates')
        .insert({ system_type, features, timeline, contact_email, estimated_price: `EUR ${low}-${high}`, price_low: low, price_high: high, locale }),
  );
  return result === 'ok' ? { status: 'success' } : { status: 'error', reason: result };
};
