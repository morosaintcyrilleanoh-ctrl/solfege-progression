/**
 * Test de bout en bout du laboratoire de lecture des notes, dans Chromium.
 *
 * Le test lit la note DIRECTEMENT DANS LE DESSIN SVG (position verticale de la
 * tête de note par rapport aux 5 lignes, symbole de clé, symbole d'altération),
 * en déduit le nom de la note de façon indépendante, puis répond. Si le dessin
 * ne correspondait pas à la note attendue par l'application, la correction
 * dirait « faux » et le test échouerait.
 *
 * Prérequis : `npm run build`. Usage : `npm run test:e2e`
 * Variables : BASE_URL (sinon un serveur `next start` est lancé), SW_CACHE (nom du cache
 *             du service worker, « sp-v1 » par défaut), CHROMIUM_PATH,
 *             SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const PORT = 3123;
let server = null;
let baseUrl = process.env.BASE_URL;
const shotsDir = process.env.SCREENSHOTS_DIR;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const FR = { C: 'Do', D: 'Ré', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BOTTOM_LINE = { treble: 4 * 7 + 2 /* E4 */, bass: 2 * 7 + 4 /* G2 */ };
const SHARP_NAMES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];

let failures = 0;
function check(condition, message) {
  if (condition) return;
  failures++;
  console.error(`  ✗ ${message}`);
}

async function startServer() {
  if (baseUrl) return;
  baseUrl = `http://localhost:${PORT}`;
  // Groupe de processus dédié pour pouvoir tout arrêter à la fin (npx lance un sous-processus).
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(baseUrl);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Le serveur ne démarre pas');
}

/** Lit la note dessinée sur la portée, sans rien demander à l'application. */
async function readStaff(page) {
  await page.waitForSelector('[data-testid=staff] .vf-notehead text');
  const g = await page.$eval('[data-testid=staff]', (host) => {
    // VexFlow décale les lignes de 0,5 px pour un trait net : on revient à la coordonnée exacte.
    const lines = [...host.querySelectorAll('.vf-stave path')].map((p) => Number(/M[\d.]+ ([\d.]+)/.exec(p.getAttribute('d'))[1]) - 0.5);
    const head = host.querySelector('.vf-notehead text');
    const clef = host.querySelector('.vf-clef text')?.textContent ?? '';
    const acc = [...host.querySelectorAll('.vf-stavenote text')].map((t) => t.textContent).join('');
    return { lines, headY: Number(head.getAttribute('y')), clef, acc, check: host.dataset.positionCheck };
  });
  const sorted = g.lines.sort((a, b) => a - b);
  const spacing = (sorted[4] - sorted[0]) / 4;
  const stepFloat = ((sorted[4] - g.headY) / spacing) * 2;
  const step = Math.round(stepFloat);
  if (Math.abs(stepFloat - step) > 0.05) throw new Error(`Tête de note hors position (${stepFloat})`);
  const clef = g.clef.includes('') ? 'treble' : g.clef.includes('') ? 'bass' : null;
  if (!clef) throw new Error('Clé non reconnue');
  const accidental = g.acc.includes('') ? 1 : g.acc.includes('') ? -1 : 0;
  const index = BOTTOM_LINE[clef] + step;
  const octave = Math.floor(index / 7);
  const letter = LETTERS[index - octave * 7];
  const midi = 12 * (octave + 1) + SEMIS[letter] + accidental;
  return { clef, step, letter, accidental, octave, midi, positionCheck: g.check };
}

async function feedbackText(page) {
  const box = page.locator('[aria-live=polite] .animate-fade-in');
  await box.waitFor();
  return box.innerText();
}

async function answerByButtons(page, note) {
  if (note.accidental !== 0) {
    await page.getByRole('button', { name: note.accidental === 1 ? /Dièse/ : /Bémol/ }).click();
  }
  await page.getByRole('group', { name: 'Nom de la note' }).getByRole('button', { name: new RegExp(`^${FR[note.letter]}`) }).click();
}

async function answerByPiano(page, note) {
  const name = `${SHARP_NAMES[note.midi % 12]} ${Math.floor(note.midi / 12) - 2}`; // octave française
  await page.getByRole('button', { name, exact: true }).click();
}

async function nextQuestion(page) {
  await page.getByRole('button', { name: /Question suivante/ }).click();
}

async function configure(page, { clef, level, answer }) {
  await page.goto(`${baseUrl}/laboratoires/lecture-des-notes`);
  await page.getByRole('button', { name: clef, exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`^Niveau ${level}`) }).click();
  await page.getByRole('button', { name: answer === 'piano' ? /Clavier de piano/ : /^Boutons/ }).click();
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 1, `${label} : défilement horizontal de ${overflow}px`);
}

async function trainingRun(page, { clef, level, answer, questions }) {
  console.log(`• Entraînement — ${clef}, niveau ${level}, ${answer}`);
  await configure(page, { clef, level, answer });
  // Pas d'enchaînement automatique : on contrôle chaque correction.
  await page.getByText('Affichage et son').click();
  const auto = page.getByRole('checkbox', { name: /Enchaîner/ });
  if (await auto.isChecked()) await auto.uncheck({ force: true });
  await page.getByRole('button', { name: /Commencer l’entraînement/ }).click();
  const seen = new Set();
  for (let i = 0; i < questions; i++) {
    const note = await readStaff(page);
    seen.add(`${note.clef}:${note.step}`);
    check(note.positionCheck === 'ok', `vérification de position interne : ${note.positionCheck}`);
    if (answer === 'piano') await answerByPiano(page, note);
    else await answerByButtons(page, note);
    const text = await feedbackText(page);
    check(text.startsWith('Bravo'), `question ${i + 1} (${note.clef} step ${note.step} → ${note.letter}${note.accidental}${note.octave}) : « ${text.split('\n')[0]} »`);
    await nextQuestion(page);
  }
  await noHorizontalScroll(page, `labo ${clef} niveau ${level}`);
  return seen;
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

  // Pages principales sur téléphone.
  for (const path of ['/', '/laboratoires', '/tableau-de-bord', '/laboratoires/lecture-des-notes/historique']) {
    await page.goto(baseUrl + path);
    await page.waitForLoadState('networkidle');
    await noHorizontalScroll(page, path);
    if (shotsDir) await page.screenshot({ path: join(shotsDir, `mobile${path.replaceAll('/', '_') || '_home'}.png`), fullPage: true });
  }

  // 1. Lecture : la note dessinée correspond-elle à la note corrigée ?
  const trebleSeen = await trainingRun(page, { clef: 'Clé de sol', level: 3, answer: 'buttons', questions: 40 });
  check(trebleSeen.size >= 12, `variété insuffisante en clé de sol (${trebleSeen.size} positions)`);
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_lab_treble.png'), fullPage: true });
  await trainingRun(page, { clef: 'Clé de fa', level: 3, answer: 'buttons', questions: 30 });
  await trainingRun(page, { clef: 'Les deux', level: 4, answer: 'buttons', questions: 30 });
  await trainingRun(page, { clef: 'Les deux', level: 2, answer: 'piano', questions: 20 });
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_lab_piano.png'), fullPage: true });

  // 2. Une mauvaise réponse est corrigée avec une explication.
  console.log('• Correction d’une erreur');
  await configure(page, { clef: 'Clé de sol', level: 1, answer: 'buttons' });
  await page.getByRole('button', { name: /Commencer l’entraînement/ }).click();
  const note = await readStaff(page);
  const wrong = LETTERS[(LETTERS.indexOf(note.letter) + 1) % 7];
  await page.getByRole('group', { name: 'Nom de la note' }).getByRole('button', { name: new RegExp(`^${FR[wrong]}`) }).click();
  const text = await feedbackText(page);
  check(text.includes(`Ce n’est pas ${FR[wrong]}`) && text.includes('En clé de sol'), `explication attendue, reçu « ${text} »`);
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_lab_wrong.png'), fullPage: true });
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page.getByText('Entraînement terminé').waitFor();
  check(await page.getByText('0/1').isVisible(), 'score de fin d’entraînement');

  // 3. Évaluation interrompue par un rechargement, puis reprise.
  console.log('• Évaluation avec reprise après rechargement');
  await configure(page, { clef: 'Les deux', level: 2, answer: 'buttons' });
  await page.getByRole('button', { name: /^Évaluation/ }).click();
  for (let i = 0; i < 4; i++) {
    await answerByButtons(page, await readStaff(page));
    await page.getByText(`Question ${i + 2}/10`).waitFor();
  }
  await page.reload();
  await page.getByText('Une évaluation est en cours').waitFor();
  await page.getByRole('button', { name: 'Reprendre' }).click();
  await page.getByText('Question 5/10').waitFor();
  for (let i = 4; i < 10; i++) await answerByButtons(page, await readStaff(page));
  await page.getByText('Évaluation terminée').waitFor();
  check(await page.getByText('100 %').first().isVisible(), 'évaluation entièrement juste attendue');
  check((await page.locator('ol > li').count()) === 10, 'la correction doit lister 10 questions');
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_eval_results.png'), fullPage: true });

  // 4. L'historique contient les séances.
  console.log('• Historique et tableau de bord');
  await page.goto(`${baseUrl}/laboratoires/lecture-des-notes/historique`);
  await page.getByRole('heading', { name: 'Séances' }).waitFor();
  const rows = await page.locator('section ul.divide-y > li').count();
  check(rows === 6, `6 séances attendues dans l’historique, ${rows} trouvées`);
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_history.png'), fullPage: true });
  await page.goto(`${baseUrl}/tableau-de-bord`);
  await page.getByText('Résultats récents').waitFor();
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'mobile_dashboard.png'), fullPage: true });

  // 5. Affichage ordinateur.
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await desktop.goto(`${baseUrl}/laboratoires/lecture-des-notes`);
  await desktop.getByRole('button', { name: /Commencer l’entraînement/ }).click();
  await readStaff(desktop);
  await desktop.keyboard.press('1');
  await feedbackText(desktop);
  if (shotsDir) await desktop.screenshot({ path: join(shotsDir, 'desktop_lab.png'), fullPage: true });

  // 6. Hors connexion : les laboratoires restent utilisables (service worker).
  console.log('• Hors connexion');
  const offlineCtx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const off = await offlineCtx.newPage();
  await off.goto(`${baseUrl}/laboratoires/rythme`);
  await off.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await off.goto(`${baseUrl}/laboratoires/lecture-des-notes`);
  await off.reload(); // page désormais contrôlée par le service worker
  await off.getByRole('button', { name: /Commencer l’entraînement/ }).waitFor();
  // Le moteur de portée est préchargé en tâche de fond (police chargée), et
  // chaque fichier utilisé par la page doit être dans le cache du service worker.
  let offlineReady = false;
  for (let i = 0; i < 80 && !offlineReady; i++) {
    offlineReady = await off.evaluate(async ({ name, prefix }) => {
      if (!document.fonts.check('40px Bravura')) return false;
      const cache = await caches.open(name);
      const used = performance
        .getEntriesByType('resource')
        .map((e) => new URL(e.name))
        .filter((u) => u.origin === location.origin && u.pathname.startsWith(prefix));
      const hits = await Promise.all(used.map((u) => cache.match(u.href)));
      return used.length > 0 && hits.every(Boolean);
    }, { name: process.env.SW_CACHE ?? 'sp-v1', prefix: `${new URL(baseUrl).pathname.replace(/\/$/, '')}/_next/static/` });
    if (!offlineReady) await off.waitForTimeout(250);
  }
  check(offlineReady, 'fichiers du laboratoire absents du cache hors connexion');
  // Sans le cache HTTP du navigateur, seul le service worker peut servir les fichiers.
  const cdp = await offlineCtx.newCDPSession(off);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await offlineCtx.setOffline(true);
  await off.reload();
  await off.getByRole('button', { name: /Commencer l’entraînement/ }).click();
  const offNote = await readStaff(off);
  await off.getByRole('group', { name: 'Nom de la note' }).getByRole('button', { name: new RegExp(`^${FR[offNote.letter]}`) }).click();
  check((await feedbackText(off)).startsWith('Bravo'), 'exercice hors connexion');
  await offlineCtx.close();

  check(errors.length === 0, `erreurs dans la console : ${errors.join(' | ')}`);
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
    console.log('\nTous les tests de bout en bout sont passés.');
  });
