import 'server-only';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import type { AppRole, ProfileRow } from '@/lib/supabase/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNextPath } from './redirects';

export type SessionState =
  | { status: 'unconfigured' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; userId: string; email: string; profile: ProfileRow };

/**
 * Utilisateur connecté et son profil, vérifiés auprès de Supabase Auth
 * (getUser contrôle le jeton côté serveur ; on ne se fie pas au seul cookie).
 */
export const getSession = cache(async (): Promise<SessionState> => {
  // Toujours calculé à la requête (jamais pré-généré) : dépend de la session de la personne.
  await connection();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: 'unconfigured' };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: 'anonymous' };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  if (!profile) return { status: 'anonymous' };
  return { status: 'authenticated', userId: data.user.id, email: data.user.email ?? '', profile };
});

/** Exige une connexion ; sinon redirige vers la page de connexion. */
export async function requireUser(nextPath: string) {
  const session = await getSession();
  if (session.status === 'unconfigured') redirect('/configuration');
  if (session.status !== 'authenticated') redirect(`/connexion?suivant=${encodeURIComponent(safeNextPath(nextPath))}`);
  if (!session.profile.is_active) redirect('/compte-desactive');
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/configuration');
  return { ...session, supabase };
}

/** Exige un des rôles donnés (vérifié côté serveur ; la base applique en plus ses propres règles). */
export async function requireRole(roles: AppRole[], nextPath: string) {
  const ctx = await requireUser(nextPath);
  if (!roles.includes(ctx.profile.role)) redirect('/acces-refuse');
  return ctx;
}

export function homeForRole(role: AppRole): string {
  return role === 'admin' ? '/espace/admin' : role === 'trainer' ? '/espace/formateur' : '/espace/eleve';
}
