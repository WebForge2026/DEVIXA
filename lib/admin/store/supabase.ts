import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { emptyContent, normalizeStatus, type ContentState, type Lead, type LeadConfig } from '../types';
import type { AdminStore } from './types';

type QuoteRow = {
  id: string;
  created_at: string;
  status: string | null;
  notes: string | null;
  system_type: string;
  features: string[] | null;
  timeline: string;
  contact_email: string;
  price_low: number | null;
  price_high: number | null;
  locale: string | null;
};

type ContactRow = {
  id: string;
  created_at: string;
  status: string | null;
  notes: string | null;
  full_name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  estimated_budget: string | null;
  message: string | null;
  locale: string | null;
};

const fromQuote = (r: QuoteRow): Lead => ({
  id: r.id,
  kind: 'quote',
  createdAt: r.created_at,
  status: normalizeStatus(r.status),
  notes: r.notes ?? '',
  name: null,
  email: r.contact_email,
  company: null,
  phone: null,
  priceLow: r.price_low,
  priceHigh: r.price_high,
  budgetLabel: null,
  projectType: null,
  message: null,
  config: { systemType: r.system_type, features: r.features ?? [], timeline: r.timeline } satisfies LeadConfig,
  locale: r.locale,
});

const fromContact = (r: ContactRow): Lead => ({
  id: r.id,
  kind: 'contact',
  createdAt: r.created_at,
  status: normalizeStatus(r.status),
  notes: r.notes ?? '',
  name: r.full_name,
  email: r.email,
  company: r.company,
  phone: null,
  priceLow: null,
  priceHigh: null,
  budgetLabel: r.estimated_budget,
  projectType: r.project_type,
  message: r.message,
  config: null,
  locale: r.locale,
});

const check = <T>({ data, error }: { data: T | null; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data as T;
};

export const createSupabaseStore = (): AdminStore => {
  const db = createAdminClient();
  return {
    kind: 'supabase',
    persistent: true,
    recordEvent: async (e) => {
      check(await db.from('site_events').insert({ type: e.type, path: e.path, locale: e.locale, visitor: e.visitor, created_at: e.createdAt }));
    },
    heartbeat: async (p) => {
      check(await db.from('site_presence').upsert({ visitor: p.visitor, path: p.path, last_seen: p.lastSeen }));
    },
    listEvents: async (since) => {
      const rows = check(
        await db.from('site_events').select('type, path, locale, visitor, created_at').gte('created_at', since.toISOString()).order('created_at').limit(100_000),
      ) as { type: string; path: string; locale: string; visitor: string; created_at: string }[];
      return rows.map((r) => ({ type: r.type as 'pageview', path: r.path, locale: r.locale, visitor: r.visitor, createdAt: r.created_at }));
    },
    listPresence: async (since) => {
      const rows = check(await db.from('site_presence').select('visitor, path, last_seen').gte('last_seen', since.toISOString())) as {
        visitor: string;
        path: string;
        last_seen: string;
      }[];
      return rows.map((r) => ({ visitor: r.visitor, path: r.path, lastSeen: r.last_seen }));
    },
    createLead: async (lead) => {
      if (lead.kind === 'quote' && lead.config) {
        check(
          await db.from('project_estimates').insert({
            system_type: lead.config.systemType,
            features: lead.config.features,
            timeline: lead.config.timeline,
            contact_email: lead.email,
            estimated_price: `EUR ${lead.priceLow}-${lead.priceHigh}`,
            price_low: lead.priceLow,
            price_high: lead.priceHigh,
            locale: lead.locale,
          }),
        );
      } else {
        check(
          await db.from('leads').insert({
            full_name: lead.name ?? '',
            email: lead.email,
            company: lead.company,
            project_type: lead.projectType ?? '',
            estimated_budget: lead.budgetLabel,
            message: lead.message ?? '',
            locale: lead.locale,
          }),
        );
      }
    },
    listLeads: async () => {
      const [quotes, contacts] = await Promise.all([
        db.from('project_estimates').select('*').order('created_at', { ascending: false }).limit(2000),
        db.from('leads').select('*').order('created_at', { ascending: false }).limit(2000),
      ]);
      const all = [...(check(quotes) as QuoteRow[]).map(fromQuote), ...(check(contacts) as ContactRow[]).map(fromContact)];
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    updateLead: async (kind, id, patch) => {
      const table = kind === 'quote' ? 'project_estimates' : 'leads';
      check(await db.from(table).update(patch).eq('id', id));
    },
    getContent: async () => {
      const row = check(await db.from('site_content').select('data').eq('id', 'live').maybeSingle()) as { data: ContentState } | null;
      return row?.data ? { ...emptyContent(), ...row.data } : emptyContent();
    },
    saveContent: async (content) => {
      check(await db.from('site_content').upsert({ id: 'live', data: content, updated_at: new Date().toISOString() }));
    },
  };
};
