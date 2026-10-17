/**
 * Génère le volet « Solfège » de Music Progression Lab : une version statique des
 * laboratoires (lecture des notes, rythme, tonalités, intervalles, test de niveau,
 * progrès), aux couleurs de Music Progression Lab, servie dans le dossier /solfege.
 *
 * Les résultats restent sur l'appareil de l'élève (le service worker garde le solfège
 * utilisable hors connexion). Si l'élève est connecté au Lab, chaque séance porte son
 * identifiant et le Lab (js/solfege-bridge.js) l'enregistre dans son compte.
 *
 * Usage : node scripts/export-mpl.mjs <dossier-de-destination>
 *   ex. : node scripts/export-mpl.mjs ../music-progression-lab/solfege
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EMBED = join(ROOT, 'scripts/mpl-embed');
const BUILD = join(ROOT, '.mpl-build');
const BASE = '/solfege';
const dest = process.argv[2] ? resolve(process.argv[2]) : null;
if (!dest) {
  console.error('Usage : node scripts/export-mpl.mjs <dossier-de-destination>');
  process.exit(1);
}

/** Remplace un passage exact (échoue si le code d'origine a changé). */
function patch(file, from, to) {
  const path = join(BUILD, file);
  const text = readFileSync(path, 'utf8');
  if (!text.includes(from)) throw new Error(`Passage introuvable dans ${file} : ${from.slice(0, 60)}…`);
  writeFileSync(path, text.split(from).join(to));
}

console.log('• Copie du projet');
rmSync(BUILD, { recursive: true, force: true });
mkdirSync(BUILD);
for (const f of ['src', 'public', 'package.json', 'tsconfig.json', 'postcss.config.mjs']) cpSync(join(ROOT, f), join(BUILD, f), { recursive: true });

console.log('• Retrait des pages en ligne (comptes, cours, espaces)');
for (const d of ['acces-refuse', 'api', 'auth', 'compte-desactive', 'configuration', 'connexion', 'cours', 'espace', 'inscription', 'mot-de-passe-oublie', 'nouveau-mot-de-passe', 'profil'])
  rmSync(join(BUILD, 'src/app', d), { recursive: true, force: true });
rmSync(join(BUILD, 'src/proxy.ts'), { force: true });
rmSync(join(BUILD, 'src/app/icon.svg'), { force: true }); // icône : celle du Lab

/** Copie un fichier de la version intégrée (ses imports « ./mpl-owner » pointent vers src/lib). */
function embed(file, target) {
  writeFileSync(join(BUILD, target), readFileSync(join(EMBED, file), 'utf8').replaceAll("from './mpl-owner'", "from '@/lib/mpl-owner'"));
}

console.log('• Version intégrée (en-tête, menu, accueil, couleurs)');
cpSync(join(EMBED, 'layout.tsx'), join(BUILD, 'src/app/layout.tsx'));
cpSync(join(EMBED, 'page.tsx'), join(BUILD, 'src/app/page.tsx'));
cpSync(join(EMBED, 'SolfegeArt.tsx'), join(BUILD, 'src/app/SolfegeArt.tsx'));
for (const f of ['nav-items.ts', 'SiteHeader.tsx', 'MobileNav.tsx', 'ServiceWorker.tsx']) cpSync(join(EMBED, f), join(BUILD, 'src/components/layout', f));
embed('AccountBanner.tsx', 'src/components/dashboard/AccountBanner.tsx');
cpSync(join(EMBED, 'mpl-owner.ts'), join(BUILD, 'src/lib/mpl-owner.ts'));
mkdirSync(join(BUILD, 'src/app/espace'), { recursive: true });
embed('espace-actions.ts', 'src/app/espace/actions.ts');
writeFileSync(
  join(BUILD, 'next.config.ts'),
  readFileSync(join(EMBED, 'next.config.ts'), 'utf8').replace('const nextConfig: NextConfig = {', `const nextConfig: NextConfig = {\n  turbopack: { root: ${JSON.stringify(ROOT)} },`),
);

// Police musicale servie depuis /solfege ; couleurs de Music Progression Lab.
patch('src/app/globals.css', "url('/fonts/bravura.woff2')", `url('${BASE}/fonts/bravura.woff2')`);
// Palette blanc et bleu, commune avec Music Progression Lab.
const colors = {
  '--color-night-950: #070b1d': '--color-night-950: #0b1f3d',
  '--color-night-900: #0b1230': '--color-night-900: #1d4ed8',
  '--color-night-800: #121b45': '--color-night-800: #0b2545',
  '--color-night-700: #1c2760': '--color-night-700: #1e40af',
  '--color-night-600: #2a3780': '--color-night-600: #1e3a8a',
  '--color-accent-300: #c4b5fd': '--color-accent-300: #bfd6ff',
  '--color-accent-400: #a78bfa': '--color-accent-400: #93b8ff',
  '--color-accent-500: #8b5cf6': '--color-accent-500: #2563eb',
  '--color-accent-600: #7c3aed': '--color-accent-600: #1d4ed8',
  '--color-accent-700: #6d28d9': '--color-accent-700: #1e40af',
  '--color-electric-300: #93c5fd': '--color-electric-300: #bcd3ff',
  '--color-electric-400: #4f9bff': '--color-electric-400: #60a5fa',
  '--color-electric-500: #2f7bff': '--color-electric-500: #2563eb',
  '--color-electric-600: #1f63e6': '--color-electric-600: #1d4ed8',
  '--color-electric-700: #194fb8': '--color-electric-700: #1e40af',
  '--color-mist: #f3f5fb': '--color-mist: #f6f8fc',
  '--color-ink: #0f172a': '--color-ink: #0b2545',
};
for (const [from, to] of Object.entries(colors)) patch('src/app/globals.css', from, to);
// Animations : apparition douce, portée animée de l'accueil (désactivées si « moins de mouvement »).
writeFileSync(
  join(BUILD, 'src/app/globals.css'),
  readFileSync(join(BUILD, 'src/app/globals.css'), 'utf8') + readFileSync(join(EMBED, 'animations.css'), 'utf8'),
);

// En-têtes des laboratoires : même bandeau dégradé que l'accueil.
patch('src/components/layout/PageHero.tsx', '<div className="bg-night-900 text-white">', '<div className="mpl-band text-white">');

// Les cours en direct sont dans l'espace « Cours » de Music Progression Lab.
patch(
  'src/components/dashboard/StudentDashboard.tsx',
  `<Link href="/espace/lives" className="font-semibold text-electric-600 hover:underline">
            espace en ligne
          </Link>`,
  `<a href="/#/cours" className="font-semibold text-electric-600 hover:underline">
            espace Cours de Music Progression Lab
          </a>`,
);

// Chaque séance enregistrée porte l'identifiant de l'élève connecté au Lab (s'il y en a un) :
// le Lab n'envoie dans un compte que les séances faites par cet élève.
for (const [file, fn] of [['src/lib/note-reading/history.ts', 'toStoredSession'], ['src/lib/exercises/history.ts', 'toStoredQuiz']]) {
  const text = readFileSync(join(BUILD, file), 'utf8');
  if (!text.includes(`export function ${fn}(`)) throw new Error(`${fn} introuvable dans ${file}`);
  writeFileSync(join(BUILD, file), `import { mplOwner } from '@/lib/mpl-owner';\n${text}`);
}
patch('src/lib/note-reading/history.ts', '    items: state.items.map((i) => ({ k: questionKey(i.question), c: i.correct, ms: i.ms })),\n  };', '    items: state.items.map((i) => ({ k: questionKey(i.question), c: i.correct, ms: i.ms })),\n    ...mplOwner(),\n  };');
patch('src/lib/exercises/history.ts', '    items: state.items.map((i) => ({ s: i.question.skill, c: i.correct, ms: i.ms })),\n  };', '    items: state.items.map((i) => ({ s: i.question.skill, c: i.correct, ms: i.ms })),\n    ...mplOwner(),\n  };');

console.log('• Compilation');
execSync('npx next build', { cwd: BUILD, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' } });

console.log('• Service worker limité à /solfege');
const out = join(BUILD, 'out');
let sw = readFileSync(join(ROOT, 'public/sw.js'), 'utf8');
const pages = ['/', '/laboratoires/', '/laboratoires/lecture-des-notes/', '/laboratoires/lecture-des-notes/historique/', '/laboratoires/rythme/', '/laboratoires/tonalites/', '/laboratoires/intervalles/', '/tableau-de-bord/', '/test-de-positionnement/'].map((p) => BASE + p);
sw = sw
  .replace(/const VERSION = '[^']+';/, "const VERSION = 'mpl-solfege-v1';")
  .replace(/const PUBLIC_PAGES = \[[^\]]+\];/, `const PUBLIC_PAGES = ${JSON.stringify(pages)};`)
  .replace("'/fonts/bravura.woff2'", `'${BASE}/fonts/bravura.woff2'`)
  .replace("url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/')", `url.pathname.startsWith('${BASE}/_next/static/') || url.pathname.startsWith('${BASE}/fonts/')`)
  .replace("caches.match('/laboratoires')", `caches.match('${BASE}/')`);
for (const must of ['mpl-solfege-v1', `${BASE}/_next/static/`, `'${BASE}/'`]) if (!sw.includes(must)) throw new Error(`sw.js : adaptation incomplète (${must})`);
writeFileSync(join(out, 'sw.js'), sw);

console.log(`• Copie vers ${dest}`);
rmSync(dest, { recursive: true, force: true });
cpSync(out, dest, { recursive: true });
rmSync(BUILD, { recursive: true, force: true });
if (!existsSync(join(dest, 'index.html'))) throw new Error('index.html manquant');
console.log('\nVolet Solfège prêt.');
