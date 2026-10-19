import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { MobileNav } from '@/components/layout/MobileNav';
import { ServiceWorker } from '@/components/layout/ServiceWorker';
import { SiteHeader } from '@/components/layout/SiteHeader';
import './globals.css';

// Version intégrée à Music Progression Lab (dossier /solfege) : même police et mêmes couleurs.
const font = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

// Élève connecté au Lab : le Lab envoie ses séances de solfège dans son compte.
const BRIDGE =
  "try{for(var i=0;i<localStorage.length;i++){if(/^sb-.+-auth-token$/.test(localStorage.key(i)||'')){import('/js/solfege-bridge.js').catch(function(){});break}}}catch(e){}";

// Volet réservé aux élèves connectés au Lab : sinon, page de connexion (avant tout affichage).
const GATE =
  "try{if(!Object.keys(localStorage).some(function(k){return /^sb-.+-auth-token$/.test(k)}))location.replace('/#/connexion?retour=solfege')}catch(e){}";

export const metadata: Metadata = {
  title: { default: 'Solfège · Music Progression Lab', template: '%s · Solfège · Music Progression Lab' },
  description: 'Lecture des notes, rythme, tonalités et intervalles : le volet solfège de Music Progression Lab.',
  applicationName: 'Music Progression Lab',
  icons: { icon: '/assets/logo.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={font.variable}>
      {/* Layout racine de l'App Router : <head> y est autorisé. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" tabIndex={-1} className="pb-24 md:pb-12">
          {children}
        </main>
        <footer className="hidden border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 md:block">
          <div className="mx-auto max-w-6xl px-4">
            © Music Progression Lab — Développe ton oreille. Comprends ta musique. Progresse chaque jour.
          </div>
        </footer>
        <MobileNav />
        <ServiceWorker />
        <Script id="mpl-solfege-bridge" strategy="afterInteractive">
          {BRIDGE}
        </Script>
      </body>
    </html>
  );
}
