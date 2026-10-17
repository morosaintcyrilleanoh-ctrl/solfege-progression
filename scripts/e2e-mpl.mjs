/**
 * Vérifie le volet Solfège intégré à Music Progression Lab (dossier /solfege),
 * servi comme en ligne : accès depuis le menu et l'accueil du Lab, pages du
 * solfège, en-tête et retour au Lab, affichage sur téléphone sans erreur.
 *
 * Usage : node scripts/e2e-mpl.mjs <dossier-music-progression-lab>
 *   (après node scripts/export-mpl.mjs <dossier>/solfege)
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8790;
const base = `http://localhost:${PORT}`;
const shots = process.env.SCREENSHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (ok, msg) => {
  if (!ok) {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
};

// Le Lab charge supabase-js depuis un CDN : remplacé ici par un module minimal (visiteur non connecté).
const FAKE_SUPABASE = `export function createClient() {
  const empty = { data: [], error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, maybeSingle: async () => ({ data: null, error: null }), single: async () => ({ data: null, error: null }), then: (r) => r(empty) };
  return { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}) }, from: () => q, rpc: async () => ({ data: null, error: null }) };
}`;

const PAGES = ['/solfege/', '/solfege/laboratoires/', '/solfege/laboratoires/lecture-des-notes/', '/solfege/laboratoires/lecture-des-notes/historique/', '/solfege/laboratoires/rythme/', '/solfege/laboratoires/tonalites/', '/solfege/laboratoires/intervalles/', '/solfege/tableau-de-bord/', '/solfege/test-de-positionnement/'];

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: dir, stdio: 'ignore', detached: true });
  try {
    for (let i = 0; i < 40; i++) {
      try {
        if ((await fetch(`${base}/`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
    const browser = await chromium.launch({ executablePath });
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_SUPABASE }));
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && errors.push(m.text()));
    const missing = [];
    page.on('response', (r) => r.status() >= 400 && missing.push(`${r.status()} ${new URL(r.url()).pathname}`));

    console.log('• Accès depuis Music Progression Lab');
    await page.goto(`${base}/#/`);
    const navLink = page.locator('#nav a[href="/solfege/"]');
    await navLink.waitFor();
    check((await navLink.innerText()).trim() === 'Solfège', 'lien « Solfège » dans le menu du Lab');
    check((await page.locator('main a[href="/solfege/"]').count()) === 1, 'carte « Solfège » sur l’accueil du Lab');
    const tabs = (await page.locator('#tabbar a').allInnerTexts()).map((s) => s.trim());
    check(tabs.join('|') === 'Accueil|Oreille|Solfège|Compte', `barre du bas du Lab : ${tabs.join('|')}`);
    if (shots) await page.screenshot({ path: join(shots, 'lab-accueil.png'), fullPage: true });
    await navLink.click();
    await page.waitForURL(`${base}/solfege/`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    check((await page.locator('header').innerText()).includes('Music Progression'), 'en-tête aux couleurs du Lab');
    check(await page.locator('header img').evaluate((img) => img.complete && img.naturalWidth > 0), 'logo du Lab affiché');
    const solfegeTabs = (await page.getByRole('navigation', { name: 'Navigation mobile' }).locator('a').allInnerTexts()).map((s) => s.trim());
    check(solfegeTabs.join('|') === 'Accueil|Oreille|Solfège|Compte', `barre du bas du solfège : ${solfegeTabs.join('|')}`);

    console.log('• Pages du solfège');
    for (const p of PAGES) {
      const res = await page.goto(base + p);
      await page.waitForLoadState('networkidle');
      check(res?.status() === 200, `${p} : statut ${res?.status()}`);
      const text = await page.locator('main').innerText();
      check(text.length > 40 && !/Application error|introuvable/i.test(text), `${p} : contenu « ${text.slice(0, 80)} »`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(overflow <= 1, `${p} : défilement horizontal ${overflow}px`);
      const outside = await page.locator('a[href]').evaluateAll((as) =>
        as.map((a) => new URL(a.href)).filter((u) => u.origin === location.origin && !u.pathname.startsWith('/solfege/') && !(u.pathname === '/' && u.hash.startsWith('#/'))).map((u) => u.pathname),
      );
      check(outside.length === 0, `${p} : liens hors du solfège ${outside.join(', ')}`);
      if (shots) await page.screenshot({ path: join(shots, `solfege${p.replaceAll('/', '_').slice(0, 60)}.png`), fullPage: true });
    }

    console.log('• Retour au Lab');
    await page.goto(`${base}/solfege/laboratoires/rythme/`);
    await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Accueil' }).click();
    await page.waitForURL(`${base}/#/`);
    await page.locator('#nav a[href="/solfege/"]').waitFor();

    check(errors.length === 0, `erreurs console : ${errors.slice(0, 3).join(' | ')}`);
    check(missing.length === 0, `fichiers introuvables : ${[...new Set(missing)].slice(0, 5).join(', ')}`);
    await browser.close();
  } finally {
    try {
      process.kill(-server.pid);
    } catch {}
  }
}

main()
  .catch((e) => {
    failures++;
    console.error(e);
  })
  .finally(() => {
    if (failures) {
      console.error(`\n${failures} vérification(s) en échec`);
      process.exit(1);
    }
    console.log('\nLe volet Solfège est bien intégré à Music Progression Lab.');
    process.exit(0);
  });
