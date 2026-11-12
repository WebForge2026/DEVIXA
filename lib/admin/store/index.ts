import 'server-only';
import { isServiceRoleConfigured } from '@/lib/supabase/admin';
import { createFileStore } from './file';
import { createSupabaseStore } from './supabase';
import type { AdminStore } from './types';

let store: AdminStore | null = null;

/** Supabase when the service role key is set, otherwise the local JSON file store. */
export const getStore = (): AdminStore => {
  store ??= isServiceRoleConfigured() ? createSupabaseStore() : createFileStore();
  return store;
};

export type { AdminStore };
