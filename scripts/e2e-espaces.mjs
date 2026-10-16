/**
 * Test d'affichage des espaces connectés (élève, formateur, administrateur)
 * avec un faux serveur Supabase (scripts/fake-supabase.mjs).
 *
 * Vérifie, pour chaque page et chaque rôle : réponse 200, aucun écran
 * d'erreur, aucune erreur dans la console, pas de défilement horizontal sur
 * téléphone ; plus quelques parcours (protection des routes par rôle,
 * exercice complet, fichiers signés).
 *
 * Usage : node scripts/e2e-espaces.mjs  (compile le site avec les bonnes variables)
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { IDS, USERS, sessionCookie, startFakeSupabase } from './fake-supabase.mjs';

const SUPA_PORT = 54399;
const APP_PORT = 3130;
const base = `http://localhost:${APP_PORT}`;
const shots = process.env.SCREENSHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${SUPA_PORT}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  NEXT_PUBLIC_SITE_URL: base,
};

let failures = 0;
const check = (ok, msg) => {
  if (!ok) {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
};

const PAGES = {
  student: [
    '/espace/eleve', '/profil', '/cours', '/cours/solfege-debutant', `/cours/solfege-debutant/lecon/${IDS.L1}`,
    `/espace/eleve/exercices/${IDS.E1}`, '/espace/eleve/devoirs', `/espace/eleve/devoirs/${IDS.A1}`,
    '/espace/lives', `/espace/lives/${IDS.LV1}`, `/espace/lives/${IDS.LV2}`, '/espace/annonces',
  ],
  trainer: [
    '/espace/formateur', '/espace/formateur/cours', '/espace/formateur/cours/nouveau', `/espace/formateur/cours/${IDS.C1}`,
    `/espace/formateur/lecons/${IDS.L1}`, '/espace/formateur/exercices', '/espace/formateur/exercices/nouveau', `/espace/formateur/exercices/${IDS.E1}`,
    '/espace/formateur/groupes', `/espace/formateur/groupes/${IDS.G1}`, '/espace/formateur/eleves', `/espace/formateur/eleves/${USERS.student.id}`,
    '/espace/formateur/devoirs', '/espace/formateur/devoirs/nouveau', `/espace/formateur/devoirs/${IDS.A1}`,
    '/espace/lives', '/espace/lives/nouveau', `/espace/lives/${IDS.LV1}/modifier`, '/espace/annonces',
  ],
  admin: ['/espace/admin', '/espace/admin/comptes', '/espace/admin/parametres', '/espace/formateur/cours'],
};

async function main() {
  const { server, requests } = await startFakeSupabase(SUPA_PORT);
  if (!process.env.SKIP_BUILD) {
    console.log('• Compilation avec la configuration de test…');
    execSync('npx next build', { env, stdio: 'ignore' });
  }
  const app = spawn('npx', ['next', 'start', '-p', String(APP_PORT)], { env, stdio: 'ignore', detached: true });
  try {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(`${base}/`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
    const browser = await chromium.launch({ executablePath });

    // Visiteur non connecté : redirigé vers la connexion.
    const anon = await browser.newPage();
    await anon.goto(`${base}/espace/formateur`);
    check(new URL(anon.url()).pathname === '/connexion', `visiteur non redirigé : ${anon.url()}`);

    // Inscription avec code d'invitation : absent, incorrect, puis correct.
    console.log('• Inscription avec code d’invitation');
    await anon.goto(`${base}/inscription`);
    const fill = async (code) => {
      for (const [name, value] of [['first_name', 'Ama'], ['email', 'ama@test.local'], ['password', 'Musique2026'], ['password_confirm', 'Musique2026'], ['invite_code', code]])
        await anon.locator(`input[name=${name}]`).fill(value);
      await anon.getByRole('checkbox').check();
      await anon.getByRole('button', { name: 'Créer mon compte' }).click();
    };
    await fill('');
    await anon.getByText('Code d’invitation requis').waitFor();
    await fill('mauvais');
    await anon.getByText('Code d’invitation incorrect.').waitFor();
    await fill('solfege2026');
    await anon.getByText('Compte créé.').waitFor();
    const signups = requests.filter((r) => r.path === '/auth/v1/signup');
    check(signups.length === 2, `inscriptions envoyées : ${signups.length} (attendu 2, la première est bloquée avant l’envoi)`);
    await anon.close();

    for (const role of ['student', 'trainer', 'admin']) {
      console.log(`• Pages ${role}`);
      const context = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      await context.addCookies([{ name: 'sb-127-auth-token', value: sessionCookie(role), url: base }]);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && errors.push(m.text()));
      for (const path of PAGES[role]) {
        const res = await page.goto(base + path);
        await page.waitForLoadState('networkidle');
        const text = await page.locator('main').innerText();
        check(res?.status() === 200, `${role} ${path} : statut ${res?.status()}`);
        check(new URL(page.url()).pathname === path, `${role} ${path} : redirigé vers ${page.url()}`);
        check(!/L’action n’a pas abouti|Application error|Impossible de charger/.test(text), `${role} ${path} : erreur affichée « ${text.slice(0, 120)} »`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(overflow <= 1, `${role} ${path} : défilement horizontal ${overflow}px`);
        if (shots) await page.screenshot({ path: join(shots, `${role}${path.replaceAll('/', '_').slice(0, 60)}.png`), fullPage: true });
      }
      check(errors.length === 0, `${role} : erreurs console ${errors.slice(0, 3).join(' | ')}`);

      // Un élève ne peut pas ouvrir l'espace formateur ou administrateur.
      if (role === 'student') {
        for (const p of ['/espace/formateur', '/espace/admin/comptes']) {
          await page.goto(base + p);
          check(new URL(page.url()).pathname === '/acces-refuse', `élève sur ${p} : ${page.url()}`);
        }
        // Parcours complet d'un exercice : réponses envoyées à la fonction de correction.
        await page.goto(`${base}/espace/eleve/exercices/${IDS.E1}`);
        await page.getByRole('group', { name: 'Choix de réponse' }).getByRole('button', { name: 'Sol' }).click();
        await page.getByPlaceholder(/réponse/i).fill('6');
        await page.getByRole('button', { name: 'Valider' }).click();
        const selects = page.locator('form select');
        await selects.nth(0).selectOption('4 temps');
        await selects.nth(1).selectOption('2 temps');
        await page.getByRole('button', { name: 'Valider' }).click();
        await page.getByText('Résultat enregistré sur ton compte').waitFor();
        const sent = requests.filter((r) => r.path === '/rest/v1/rpc/submit_exercise_attempt');
        check(sent.length === 1, `correction appelée ${sent.length} fois`);
        if (shots) await page.screenshot({ path: join(shots, 'student_exercise_result.png'), fullPage: true });
        // Téléchargement d'une ressource : redirection vers un lien signé.
        const r = await page.request.get(`${base}/api/fichiers/ressource/00000000-0000-4000-8000-000000000901`, { maxRedirects: 0 });
        check(r.status() === 307 && (r.headers().location ?? '').includes('/object/sign/'), `ressource : ${r.status()} ${r.headers().location}`);
        const bad = await page.request.get(`${base}/api/fichiers/ressource/pas-un-uuid`, { maxRedirects: 0 });
        check(bad.status() === 404, `identifiant invalide : ${bad.status()}`);
      }
      if (role === 'admin') {
        await page.goto(`${base}/espace/admin/parametres`);
        check((await page.locator('input[name=invite_code]').inputValue()) === 'SOLFEGE2026', 'l’admin voit le code d’invitation');
      }
      if (role === 'trainer') {
        await page.goto(`${base}/espace/admin`);
        check(new URL(page.url()).pathname === '/acces-refuse', `formateur sur /espace/admin : ${page.url()}`);
      }
      await context.close();
    }
    await browser.close();
  } finally {
    try {
      process.kill(-app.pid);
    } catch {}
    server.close();
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
    console.log('\nToutes les pages des espaces connectés s’affichent correctement.');
    process.exit(0);
  });
