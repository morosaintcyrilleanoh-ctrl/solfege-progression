/**
 * Configuration Supabase. Seules l'URL et la clé PUBLIQUE sont utilisées par
 * l'application : la sécurité repose sur les règles de la base (RLS).
 * Aucune clé secrète n'est nécessaire au fonctionnement du site.
 */
export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function getSupabaseConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !publishableKey || !/^https?:\/\//.test(url)) return null;
  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
