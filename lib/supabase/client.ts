import { createBrowserClient } from '@supabase/ssr';

/** Browser Supabase client (anon key; RLS restricts it to INSERT only). */
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
