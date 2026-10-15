import type { Metadata } from 'next';
import Link from 'next/link';
import { EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Administration' };

const LABELS: [string, string][] = [
  ['students', 'Élèves'],
  ['trainers', 'Formateurs'],
  ['admins', 'Administrateurs'],
  ['inactive', 'Comptes désactivés'],
  ['courses_published', 'Cours publiés'],
  ['courses_draft', 'Cours en brouillon'],
  ['enrollments', 'Inscriptions actives'],
  ['active_students_7d', 'Élèves actifs (7 jours)'],
  ['attempts_7d', 'Séances (7 jours)'],
  ['submissions_pending', 'Devoirs à corriger'],
  ['lives_upcoming', 'Lives à venir'],
];

export default async function AdminHome() {
  const { profile, supabase } = await requireRole(['admin'], '/espace/admin');
  const { data, error } = await supabase.rpc('admin_overview');
  const stats = (data ?? {}) as Record<string, number>;
  return (
    <EspaceShell profile={profile} title="Administration" subtitle="Statistiques générales de la plateforme.">
      {error && <QueryError what="les statistiques" />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {LABELS.map(([key, label]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{typeof stats[key] === 'number' ? stats[key] : '—'}</p>
          </div>
        ))}
      </div>
      <Section title="Gestion">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li>
            <Link href="/espace/admin/comptes" className="font-semibold text-electric-600 hover:underline">
              Comptes et rôles
            </Link>{' '}
            — attribuer les rôles, désactiver un compte.
          </li>
          <li>
            <Link href="/espace/formateur/cours" className="font-semibold text-electric-600 hover:underline">
              Cours, modules et niveaux
            </Link>{' '}
            — publier ou dépublier.
          </li>
          <li>
            <Link href="/espace/annonces" className="font-semibold text-electric-600 hover:underline">
              Annonces
            </Link>{' '}
            — messages à toute la plateforme.
          </li>
          <li>
            <Link href="/espace/admin/parametres" className="font-semibold text-electric-600 hover:underline">
              Paramètres
            </Link>{' '}
            — inscriptions, objectif par défaut.
          </li>
        </ul>
      </Section>
    </EspaceShell>
  );
}
