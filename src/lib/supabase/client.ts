'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Client Supabase dans le navigateur (session de l'utilisateur, soumis au RLS). */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createBrowserClient<Database>(url, key);
  return client;
}
