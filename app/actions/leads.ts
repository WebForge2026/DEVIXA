'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { estimateRange, featureIds, systemTypes, timelineIds } from '@/lib/estimate';
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

/** Bots fill every field; humans never see this one. */
const isBot = (formData: FormData) => String(formData.get('website') ?? '').length > 0;

export const submitLead = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  if (isBot(formData)) return { status: 'success' };

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: 'error', reason: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (isRateLimited()) return { status: 'error', reason: 'rate' };
  if (!isSupabaseConfigured()) return { status: 'error', reason: 'config' };

  const { consent: _consent, ...lead } = parsed.data;
  const { error } = await createClient().from('leads').insert(lead);
  if (error) {
    console.error('[leads] insert failed', error.code, error.message);
    return { status: 'error', reason: 'server' };
  }
  return { status: 'success' };
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
  if (!isSupabaseConfigured()) return { status: 'error', reason: 'config' };

  const { system_type, features, timeline, contact_email } = parsed.data;
  // Recalculate server-side: the client preview is never trusted.
  const { low, high } = estimateRange(system_type, features, timeline);

  const { error } = await createClient()
    .from('project_estimates')
    .insert({ system_type, features, timeline, contact_email, estimated_price: `EUR ${low}-${high}` });
  if (error) {
    console.error('[project_estimates] insert failed', error.code, error.message);
    return { status: 'error', reason: 'server' };
  }
  return { status: 'success' };
};
