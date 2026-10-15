import type { Metadata } from 'next';
import Link from 'next/link';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ProfileForm } from '@/components/espace/ProfileForm';
import { requireUser } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, ROLE_LABELS } from '@/lib/data/names';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { profile, email } = await requireUser('/profil');
  const { bienvenue } = await searchParams;
  return (
    <EspaceShell profile={profile} title="Mon profil musical" subtitle={email}>
      {bienvenue && (
        <p role="status" className="rounded-xl bg-success-50 p-3 text-sm text-success-700">
          Bienvenue ! Complète ton profil, puis passe le test de positionnement pour savoir par où commencer.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Informations" className="lg:col-span-2">
          <ProfileForm profile={profile} />
        </Section>
        <Section title="Mon niveau">
          <p className="text-sm text-slate-600">Rôle : {ROLE_LABELS[profile.role]}</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{LEVEL_LABELS_DB[profile.level]}</p>
          <p className="mt-2 text-sm text-slate-600">
            Ton niveau est fixé par le test de positionnement ou par ton formateur. Il détermine les modules accessibles.
          </p>
          <Link href="/test-de-positionnement" className="mt-3 inline-block text-sm font-semibold text-electric-600 hover:underline">
            {profile.placement ? 'Repasser le test de positionnement' : 'Passer le test de positionnement'}
          </Link>
          <Link href="/nouveau-mot-de-passe" className="mt-2 block text-sm font-semibold text-electric-600 hover:underline">
            Changer mon mot de passe
          </Link>
        </Section>
      </div>
    </EspaceShell>
  );
}
