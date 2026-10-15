import type { Metadata } from 'next';
import Link from 'next/link';
import { setActiveAction } from '@/app/espace/admin/actions';
import { RoleForm } from '@/components/espace/AdminForms';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, ROLE_LABELS, displayName } from '@/lib/data/names';
import type { AppRole } from '@/lib/supabase/database.types';

export const metadata: Metadata = { title: 'Comptes' };

const PAGE = 30;

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const { profile, supabase, userId } = await requireRole(['admin'], '/espace/admin/comptes');
  const sp = await searchParams;
  const q = (sp.q ?? '').slice(0, 80);
  const role = (['admin', 'trainer', 'student'] as const).includes(sp.role as AppRole) ? (sp.role as AppRole) : null;
  const page = Math.max(0, Number.parseInt(sp.page ?? '0', 10) || 0);
  const { data, error } = await supabase.rpc('admin_list_users', { p_search: q, p_role: role, p_limit: PAGE, p_offset: page * PAGE });
  const total = data?.[0]?.total ?? 0;
  const link = (p: number) => `/espace/admin/comptes?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(p) })}`;
  return (
    <EspaceShell profile={profile} title="Comptes et rôles" subtitle="Seuls les administrateurs attribuent les rôles (contrôlé par la base).">
      <form className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="q">
          Rechercher
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Nom ou e-mail" className="min-h-11 flex-1 rounded-xl border-2 border-slate-300 bg-white px-3" />
        <select name="role" defaultValue={role ?? ''} className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-3" aria-label="Rôle">
          <option value="">Tous les rôles</option>
          <option value="student">Élèves</option>
          <option value="trainer">Formateurs</option>
          <option value="admin">Administrateurs</option>
        </select>
        <button type="submit" className={buttonClasses('secondary')}>
          Filtrer
        </button>
      </form>
      {error && <QueryError what="les comptes" />}
      <Section title={`${total} compte(s)`}>
        {data?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.map((u) => (
              <li key={u.id} className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="text-sm">
                  <p className="font-semibold text-ink">
                    {displayName(u)} {!u.is_active && <Badge tone="danger">Désactivé</Badge>}
                  </p>
                  <p className="text-slate-600">{u.email}</p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABELS[u.role]} · {LEVEL_LABELS_DB[u.level]}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  {u.id !== userId && (
                    <>
                      <div className="w-44">
                        <RoleForm userId={u.id} role={u.role} />
                      </div>
                      <ConfirmButton
                        action={setActiveAction.bind(null, u.id, !u.is_active)}
                        label={u.is_active ? 'Désactiver' : 'Réactiver'}
                        confirm={u.is_active ? 'Désactiver ce compte ? La personne perdra l’accès à son espace.' : undefined}
                        variant="secondary"
                      />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucun compte ne correspond.</Empty>
        )}
        <div className="mt-3 flex justify-between text-sm">
          {page > 0 ? <Link href={link(page - 1)} className="font-semibold text-electric-600">← Précédents</Link> : <span />}
          {(page + 1) * PAGE < total && <Link href={link(page + 1)} className="font-semibold text-electric-600">Suivants →</Link>}
        </div>
      </Section>
    </EspaceShell>
  );
}
