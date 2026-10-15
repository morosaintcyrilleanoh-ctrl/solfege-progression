import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteLiveAction } from '@/app/espace/lives/actions';
import { ReplayUpload } from '@/components/academy/LiveForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { LocalTime } from '@/components/ui/LocalTime';
import { requireUser } from '@/lib/auth/session';
import { LessonContent } from '@/lib/content/markdown';
import { displayName } from '@/lib/data/names';

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireUser(`/espace/lives/${id}`);
  const { data: live } = await supabase.from('live_sessions').select('*').eq('id', id).maybeSingle();
  if (!live) notFound();
  const { data: trainer } = await supabase.from('profiles').select('first_name, last_name').eq('id', live.trainer_id).maybeSingle();
  const canEdit = live.trainer_id === userId || profile.role === 'admin';
  const hasReplay = !!(live.replay_url || live.replay_path);
  return (
    <EspaceShell profile={profile} title={live.title} subtitle={`Avec ${displayName(trainer)}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Présentation" className="lg:col-span-2">
          {live.description ? <LessonContent source={live.description} /> : <p className="text-sm text-slate-500">Pas de description.</p>}
        </Section>
        <Section title="Informations">
          <p className="text-sm text-slate-700">
            <LocalTime iso={live.starts_at} /> · {live.duration_minutes} min
          </p>
          <p className="mt-2">
            {live.status === 'cancelled' ? <Badge tone="danger">Séance annulée</Badge> : live.status === 'completed' ? <Badge>Séance terminée</Badge> : <Badge tone="electric">Programmée</Badge>}
          </p>
          {live.status === 'scheduled' &&
            (live.meeting_url ? (
              <a href={live.meeting_url} target="_blank" rel="noopener noreferrer" className={`${buttonClasses('primary', 'lg')} mt-4 w-full`}>
                Rejoindre la séance
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Le lien de connexion sera ajouté par le formateur.</p>
            ))}
          {hasReplay && (
            <div className="mt-4 space-y-2">
              {live.replay_url && (
                <a href={live.replay_url} target="_blank" rel="noopener noreferrer" className={`${buttonClasses('secondary')} w-full`}>
                  Voir le replay
                </a>
              )}
              {live.replay_path && (
                <a href={`/api/fichiers/replay/${live.id}`} className={`${buttonClasses('secondary')} w-full`}>
                  Télécharger le replay
                </a>
              )}
            </div>
          )}
        </Section>
      </div>
      {canEdit && (
        <Section title="Gestion de la séance">
          <div className="flex flex-wrap gap-2">
            <Link href={`/espace/lives/${live.id}/modifier`} className={buttonClasses('secondary')}>
              Modifier
            </Link>
            <ConfirmButton action={deleteLiveAction.bind(null, live.id)} label="Supprimer" confirm="Supprimer cette séance et son replay ?" />
          </div>
          <div className="mt-4 max-w-md">
            <ReplayUpload liveId={live.id} />
          </div>
        </Section>
      )}
    </EspaceShell>
  );
}
