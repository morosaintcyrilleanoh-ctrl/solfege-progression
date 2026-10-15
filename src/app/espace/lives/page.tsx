import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { LocalTime } from '@/components/ui/LocalTime';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Cours en direct' };

export default async function LivesPage() {
  const { profile, supabase } = await requireUser('/espace/lives');
  // Le RLS ne renvoie que les séances ouvertes à cet utilisateur.
  const { data, error } = await supabase.from('live_sessions').select('*').order('starts_at').limit(200);
  const now = new Date().toISOString();
  const upcoming = (data ?? []).filter((l) => l.starts_at >= now && l.status !== 'completed');
  const past = (data ?? []).filter((l) => l.starts_at < now || l.status === 'completed').reverse();
  const staff = profile.role !== 'student';
  return (
    <EspaceShell
      profile={profile}
      title="Cours en direct"
      subtitle="Calendrier des séances et bibliothèque des replays."
      actions={
        staff ? (
          <Link href="/espace/lives/nouveau" className={buttonClasses('primary')}>
            Programmer une séance
          </Link>
        ) : undefined
      }
    >
      {error && <QueryError what="les séances" />}
      <Section title="À venir">
        {upcoming.length ? (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/espace/lives/${l.id}`} className="font-semibold text-electric-700 hover:underline">
                    {l.title}
                  </Link>
                  <p className="text-sm text-slate-600">
                    <LocalTime iso={l.starts_at} /> · {l.duration_minutes} min
                  </p>
                </div>
                {l.status === 'cancelled' && <Badge tone="danger">Annulée</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune séance programmée.</Empty>
        )}
      </Section>
      <Section title="Replays et séances passées">
        {past.length ? (
          <ul className="divide-y divide-slate-100">
            {past.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/espace/lives/${l.id}`} className="font-semibold text-electric-700 hover:underline">
                    {l.title}
                  </Link>
                  <p className="text-sm text-slate-600">
                    <LocalTime iso={l.starts_at} />
                  </p>
                </div>
                {l.replay_url || l.replay_path ? <Badge tone="success">Replay disponible</Badge> : <Badge>Pas de replay</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune séance passée.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
