import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { MobileNav } from '@/components/layout/MobileNav';
import { ServiceWorker } from '@/components/layout/ServiceWorker';
import { SiteHeader } from '@/components/layout/SiteHeader';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Solfège Progression — Apprendre la musique',
    template: '%s · Solfège Progression',
  },
  description:
    'Plateforme interactive d’apprentissage du solfège et de la théorie musicale, avec le Formateur Anoh Cyrille.',
  applicationName: 'Solfège Progression',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b1230',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
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
        <footer className="hidden border-t border-slate-200 bg-white py-6 text-sm text-slate-500 md:block">
          <div className="mx-auto max-w-6xl px-4">
            Solfège Progression · Apprendre la musique · avec le Formateur Anoh Cyrille
          </div>
        </footer>
        <MobileNav />
        <ServiceWorker />
      </body>
    </html>
  );
}
