import Link from 'next/link';
import { ModuleCards } from '@/components/ModuleCards';
import { buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';

export default function SolfegeHome() {
  return (
    <>
      <section className="relative overflow-hidden bg-night-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(60% 80% at 85% 10%, rgba(124,58,237,.45), transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(37,99,235,.35), transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <p className="text-sm font-semibold text-accent-300">Music Progression Lab · Solfège</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Lis, compte, comprends : <span className="text-electric-300">le solfège pas à pas.</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/75">
            Lecture des notes sur de vraies portées, rythme et mesures, gammes et tonalités, intervalles et accords. Correction
            immédiate, même sans connexion.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/laboratoires/lecture-des-notes" className={buttonClasses('primary', 'lg')}>
              <Icon name="play" /> Lire mes premières notes
            </Link>
            <Link href="/test-de-positionnement" className={`${buttonClasses('secondary', 'lg')} !border-white/20 !bg-white/5 !text-white hover:!bg-white/10`}>
              Test de niveau
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-bold text-night-800">Les modules</h2>
        <ModuleCards />
      </section>
    </>
  );
}
