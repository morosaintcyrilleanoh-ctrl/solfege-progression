/**
 * Test de bout en bout des laboratoires à questions (rythme, tonalités, intervalles…).
 * Pour chaque niveau : 25 questions en entraînement. On vérifie que la partition
 * s'affiche sans erreur, que chaque réponse reçoit une correction expliquée et que
 * le score affiché correspond aux corrections. Puis une évaluation complète.
 *
 * Prérequis : `npm run build`. Usage : `node scripts/e2e-quiz-labs.mjs [chemin…]`
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const PORT = 3124;
let server = null;
let baseUrl = process.env.BASE_URL;
const shotsDir = process.env.SCREENSHOTS_DIR;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });
const labs = process.argv.slice(2).length ? process.argv.slice(2) : ['/laboratoires/rythme'];

let failures = 0;
const check = (ok, msg) => {
  if (!ok) {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
};

async function startServer() {
  if (baseUrl) return;
  baseUrl = `http://localhost:${PORT}`;
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Le serveur ne démarre pas');
}

async function answerCurrent(page) {
  const choices = page.getByRole('group', { name: 'Choix de réponse' }).getByRole('button');
  if (await choices.count()) {
    const n = await choices.count();
    await choices.nth(Math.floor(Math.random() * n)).click();
    return;
  }
  const input = page.getByPlaceholder(/./).first();
  if (await input.count()) {
    await input.fill('2');
    await page.getByRole('button', { name: 'Valider' }).click();
    return;
  }
  const selects = page.locator('form select');
  const count = await selects.count();
  for (let i = 0; i < count; i++) await selects.nth(i).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Valider' }).click();
}

async function main() {
  await startServer();
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  for (const lab of labs) {
    const levels = await (async () => {
      await page.goto(baseUrl + lab);
      await page.getByRole('button', { name: /Commencer l’entraînement/ }).waitFor();
      return page.locator('fieldset').first().getByRole('button').allInnerTexts();
    })();
    for (const level of levels) {
      console.log(`• ${lab} — ${level}`);
      await page.goto(baseUrl + lab);
      await page.locator('fieldset').first().getByRole('button', { name: level, exact: true }).click();
      await page.getByRole('button', { name: /Commencer l’entraînement/ }).click();
      let shown = 0;
      let correct = 0;
      for (let i = 0; i < 25; i++) {
        const score = page.locator('[data-testid=score]');
        if (await score.count()) {
          await page.waitForSelector('[data-testid=score] svg', { timeout: 10000 });
          shown++;
        }
        check(!(await page.getByText('La partition n’a pas pu être affichée').count()), `${lab} : partition en erreur`);
        await answerCurrent(page);
        const fb = page.getByTestId('quiz-feedback');
        await fb.waitFor();
        const text = await fb.innerText();
        if (text.startsWith('Bonne réponse')) correct++;
        check(text.split('\n').length >= 2, `${lab} : explication manquante`);
        if (shotsDir && i < 6) await page.screenshot({ path: join(shotsDir, `${lab.split('/').pop()}_${level}_${i}.png`), fullPage: true });
        await page.getByRole('button', { name: /Question suivante/ }).click();
      }
      const status = await page.getByText(/justes?$/).first().innerText();
      check(status.startsWith(`${correct}/25`), `${lab} : score affiché « ${status} », attendu ${correct}/25`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(overflow <= 1, `${lab} : défilement horizontal ${overflow}px`);
      console.log(`  ${shown} partitions affichées, ${correct}/25 réponses aléatoires justes`);
    }

    console.log(`• ${lab} — évaluation`);
    await page.goto(baseUrl + lab);
    await page.getByRole('button', { name: /^Évaluation/ }).click();
    for (let i = 0; i < 10; i++) {
      await page.getByText(`Question ${i + 1}/10`).waitFor();
      await answerCurrent(page);
    }
    await page.getByText('Évaluation terminée').waitFor();
    if (shotsDir) await page.screenshot({ path: join(shotsDir, `${lab.split('/').pop()}_results.png`), fullPage: true });
  }

  check(errors.length === 0, `erreurs console : ${errors.slice(0, 5).join(' | ')}`);
  await browser.close();
}

main()
  .catch((e) => {
    failures++;
    console.error(e);
  })
  .finally(() => {
    if (server) {
      try {
        process.kill(-server.pid);
      } catch {}
    }
    if (failures) {
      console.error(`\n${failures} vérification(s) en échec`);
      process.exit(1);
    }
    console.log('\nTous les tests de bout en bout des laboratoires sont passés.');
  });
