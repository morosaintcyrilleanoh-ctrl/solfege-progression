import type { ProfileRow } from '@/lib/supabase/database.types';

export function displayName(p: Pick<ProfileRow, 'first_name' | 'last_name'> | null | undefined): string {
  if (!p) return 'Utilisateur';
  const n = `${p.first_name} ${p.last_name}`.trim();
  return n || 'Sans nom';
}

export const ROLE_LABELS = { admin: 'Administrateur', trainer: 'Formateur', student: 'Élève' } as const;
export const LEVEL_LABELS_DB = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' } as const;

export function formatDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    weekday: withTime ? 'short' : undefined,
    day: 'numeric',
    month: 'long',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
    timeZone: 'Africa/Abidjan',
  });
}
