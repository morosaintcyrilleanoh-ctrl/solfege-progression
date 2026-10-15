import type { Metadata } from 'next';
import { deleteAnnouncementAction, setAnnouncementStatusAction } from '@/app/espace/lives/actions';
import { AnnouncementForm } from '@/components/academy/LiveForms';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { LocalTime } from '@/components/ui/LocalTime';
import { requireUser } from '@/lib/auth/session';
import { LessonContent } from '@/lib/content/markdown';
import { trainerOptions } from '@/lib/data/trainer-options';

export const metadata: Metadata = { title: 'Annonces' };

export default async function AnnouncementsPage() {
  const { profile, supabase, userId } = await requireUser('/espace/annonces');
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(100);
  const staff = profile.role !== 'student';
  const opts = staff ? await trainerOptions(supabase, userId, profile.role === 'admin') : null;
  return (
    <EspaceShell profile={profile} title="Annonces">
      {error && <QueryError what="les annonces" />}
      <div className={`grid gap-4 ${staff ? 'lg:grid-cols-3' : ''}`}>
        <Section title="Messages" className={staff ? 'lg:col-span-2' : ''}>
          {data?.length ? (
            <ul className="space-y-3">
              {data.map((a) => (
                <li key={a.id} className="rounded-xl bg-mist p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{a.title}</p>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      <LocalTime iso={a.published_at ?? a.created_at} dateOnly />
                      {a.status === 'draft' && <Badge>Brouillon</Badge>}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <LessonContent source={a.body} />
                  </div>
                  {(a.author_id === userId || profile.role === 'admin') && (
                    <div className="mt-2 flex gap-2">
                      <ConfirmButton action={setAnnouncementStatusAction.bind(null, a.id, a.status === 'published' ? 'draft' : 'published')} label={a.status === 'published' ? 'Dépublier' : 'Publier'} variant="secondary" />
                      <ConfirmButton action={deleteAnnouncementAction.bind(null, a.id)} label="Supprimer" confirm="Supprimer cette annonce ?" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune annonce.</Empty>
          )}
        </Section>
        {staff && opts && (
          <Section title="Nouvelle annonce">
            <AnnouncementForm courses={opts.courses} groups={opts.groups} isAdmin={profile.role === 'admin'} />
          </Section>
        )}
      </div>
    </EspaceShell>
  );
}
