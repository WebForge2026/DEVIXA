import type { ContentState, Lead, LeadKind, LeadPatch, NewLead, Presence, TelemetryEvent } from '../types';

/**
 * Persistence contract for the admin panel. Two adapters implement it:
 * - supabase: production (service role, tables from supabase/schema.sql)
 * - file:     local development / tests (JSON file, not durable on serverless hosts)
 * Swap in another database by implementing this type and wiring it in ./index.ts.
 */
export type AdminStore = {
  kind: 'supabase' | 'file';
  /** false = data may be lost (e.g. file store on a serverless host). Shown as a warning in the panel. */
  persistent: boolean;
  recordEvent: (event: TelemetryEvent) => Promise<void>;
  heartbeat: (presence: Presence) => Promise<void>;
  listEvents: (since: Date) => Promise<TelemetryEvent[]>;
  listPresence: (since: Date) => Promise<Presence[]>;
  createLead: (lead: NewLead) => Promise<void>;
  listLeads: () => Promise<Lead[]>;
  updateLead: (kind: LeadKind, id: string, patch: LeadPatch) => Promise<void>;
  getContent: () => Promise<ContentState>;
  saveContent: (content: ContentState) => Promise<void>;
};
