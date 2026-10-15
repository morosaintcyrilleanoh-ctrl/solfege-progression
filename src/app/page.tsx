import Link from 'next/link';
import { ModuleCards } from '@/components/ModuleCards';
import { buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-night-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(60% 80% at 85% 10%, rgba(124,58,237,.45), transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(47,123,255,.35), transparent 60%)' }}
        />
        {/* Portée décorative */}
        <svg aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-6 w-[520px] opacity-15" viewBox="0 0 520 80">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" x2="520" y1={10 + i * 15} y2={10 + i * 15} stroke="white" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-16">
          <p className="text-sm font-semibold text-accent-300">Apprendre la musique · avec le Formateur Anoh Cyrille</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Le solfège, pas à pas, <span className="text-electric-300">à ton rythme.</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/75 sm:text-lg">
            Lis les notes, comprends le rythme, maîtrise les gammes. Des exercices interactifs sur de vraies portées, une
            correction immédiate et le suivi de ta progression.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/laboratoires/lecture-des-notes" className={buttonClasses('primary', 'lg')}>
              <Icon name="play" /> Lire mes premières notes
            </Link>
            <Link href="/tableau-de-bord" className={`${buttonClasses('secondary', 'lg')} !border-white/20 !bg-white/5 !text-white hover:!bg-white/10`}>
              Mon tableau de bord
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">Fonctionne sur téléphone, sans son et sans création de compte pour l’instant.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-bold text-night-800">Les modules</h2>
        <ModuleCards />
      </section>
    </>
  );
}
