import Link from 'next/link';
import { ModuleCards } from '@/components/ModuleCards';
import { SolfegeArt } from './SolfegeArt';
import { buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { AccountBanner } from '@/components/dashboard/AccountBanner';

const ESPACE = [
  { href: '/#/espace-solfege/formations', icon: '🎓', label: 'Formations' },
  { href: '/#/espace-solfege/lives', icon: '🎥', label: 'Lives' },
  { href: '/#/espace-solfege/ressources', icon: '📁', label: 'Ressources' },
];

export default function SolfegeHome() {
  return (
    <>
      <section className="mpl-band relative overflow-hidden text-white">
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-9 sm:py-14 md:grid-cols-[1.1fr_0.9fr]">
          <div className="mpl-rise">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-300">Music Progression Lab · Solfège</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Lis, compte, comprends&nbsp;: <span className="text-accent-300">le solfège pas à pas.</span>
            </h1>
            <p className="mt-3 max-w-xl text-white/80 sm:text-lg">
              Lecture des notes sur de vraies portées, rythme et mesures, gammes et tonalités, intervalles et accords. Correction
              immédiate, même sans connexion.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/laboratoires/lecture-des-notes" className={`${buttonClasses('primary', 'lg')} !bg-white !text-night-800 hover:!bg-electric-500/5`}>
                <Icon name="play" /> Lire mes premières notes
              </Link>
              <Link href="/test-de-positionnement" className={`${buttonClasses('secondary', 'lg')} !border-white/50 !bg-transparent !text-white hover:!bg-white/10`}>
                Test de niveau
              </Link>
            </div>
          </div>
          <div className="mpl-rise [animation-delay:120ms]">
            <SolfegeArt />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <AccountBanner />
        <h2 className="mb-3 text-xl font-bold text-night-800">Mon espace solfège</h2>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          {ESPACE.map((e, i) => (
            // Pages du Lab (formations, lives, ressources du formateur) : liens ordinaires.
            <a
              key={e.href}
              href={e.href}
              className="mpl-rise flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-md sm:p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-electric-500/10 text-2xl" aria-hidden="true">
                {e.icon}
              </span>
              <span className="text-sm font-bold text-night-800">{e.label}</span>
            </a>
          ))}
        </div>
        {/* Prochain live et formation en cours de l'élève connecté (rempli par le Lab : js/solfege-widget.js). */}
        <div id="mpl-espace-widget" />
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link href="/tableau-de-bord" className="mpl-rise flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-md">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-electric-500/10 text-electric-600">
              <Icon name="dashboard" className="size-5" />
            </span>
            <span className="text-sm font-bold text-night-800">Mes progrès</span>
          </Link>
          <Link href="/test-de-positionnement" className="mpl-rise flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-md [animation-delay:60ms]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-electric-500/10 text-electric-600">
              <Icon name="history" className="size-5" />
            </span>
            <span className="text-sm font-bold text-night-800">Test de niveau</span>
          </Link>
        </div>
        <h2 className="mb-4 text-xl font-bold text-night-800">Les modules</h2>
        <div className="mpl-cards">
          <ModuleCards />
        </div>
      </section>
    </>
  );
}
