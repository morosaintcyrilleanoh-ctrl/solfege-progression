/**
 * Vérifie l'enregistrement des séances de solfège dans le compte Music Progression Lab :
 * solfège réservé aux élèves connectés, séances marquées au nom de l'élève connecté, envoi par le Lab (js/solfege-sync.js),
 * affichage sur le tableau de bord de l'élève et sur sa fiche côté formateur,
 * séances d'un autre élève jamais envoyées, message clair si la table manque.
 *
 * Usage : node scripts/e2e-mpl-sync.mjs <dossier-music-progression-lab>
 *   (après node scripts/export-mpl.mjs <dossier>/solfege)
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8791;
const base = `http://localhost:${PORT}`;
const shots = process.env.SCREENSHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (ok, msg) => {
  if (!ok) {
    failures++;
    console.error(`  ✗ ${msg}`);
  } else console.log(`  ✓ ${msg}`);
};

const STUDENT = '00000000-0000-4000-8000-00000000000a';
const OTHER = '00000000-0000-4000-8000-00000000000b';
const TRAINER = '00000000-0000-4000-8000-0000000000f1';

// supabase-js (CDN) remplacé par une base simulée dans le stockage local. Les règles d'accès
// réelles (RLS) sont testées à part, sur PostgreSQL (music-progression-lab/scripts/test-db.sh).
const FAKE_SUPABASE = `
const ls = localStorage;
const authKey = () => Object.keys(ls).find((k) => /^sb-.+-auth-token$/.test(k));
const session = () => { const k = authKey(); const v = k && JSON.parse(ls.getItem(k)); return v ? { access_token: 'x', user: { id: v.user.id, email: 'eleve@exemple.fr', user_metadata: {} } } : null; };
const db = () => JSON.parse(ls.getItem('__fake_db') ?? '[]');
const missing = () => ls.getItem('__fake_missing') === '1';
const MISSING = { code: 'PGRST205', message: "Could not find the table 'public.solfege_sessions'" };
export function createClient() {
  function from(table) {
    const filters = [];
    let single = false;
    const run = () => {
      if (table === 'solfege_sessions') {
        if (missing()) return { data: null, error: MISSING };
        let rows = db();
        for (const [k, v] of filters) rows = rows.filter((r) => r[k] === v);
        rows.sort((a, b) => b.started_at.localeCompare(a.started_at));
        return { data: rows, error: null };
      }
      if (table === 'profiles' && single) {
        const id = filters.find((f) => f[0] === 'id')?.[1];
        const me = session()?.user.id;
        const role = id === me ? (ls.getItem('__fake_role') ?? 'student') : 'student';
        return { data: { id, full_name: role === 'trainer' ? 'Anoh Cyrille' : 'Awa Koné', role, level: 1, xp: 40, voice_range: 'grave' }, error: null };
      }
      return { data: single ? null : [], count: 0, error: null };
    };
    const q = {
      select: () => q, eq: (k, v) => (filters.push([k, v]), q), order: () => q, limit: () => q, in: () => q, gte: () => q, neq: () => q, is: () => q, or: () => q,
      maybeSingle: async () => ((single = true), run()), single: async () => ((single = true), run()),
      upsert: async (rows, opts) => {
        if (missing()) return { error: MISSING };
        if (opts?.onConflict !== 'user_id,client_id') return { error: { message: 'onConflict attendu' } };
        const all = db();
        for (const r of rows) {
          const i = all.findIndex((x) => x.user_id === r.user_id && x.client_id === r.client_id);
          if (i >= 0) all[i] = { ...all[i], ...r }; else all.push({ id: crypto.randomUUID(), ...r });
        }
        ls.setItem('__fake_db', JSON.stringify(all));
        ls.setItem('__fake_upserts', String(Number(ls.getItem('__fake_upserts') ?? 0) + rows.length));
        return { error: null };
      },
      then: (ok, ko) => Promise.resolve(run()).then(ok, ko),
    };
    return q;
  }
  async function rpc(name) {
    if (name === 'staff_student_list') return { data: [{ id: '${STUDENT}', full_name: 'Awa Koné', email: 'awa@exemple.fr', joined_at: new Date().toISOString(), level: 1, xp: 40 }], error: null };
    return { data: name.startsWith('my_') ? [] : null, error: null };
  }
  return {
    auth: { getSession: async () => ({ data: { session: session() } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}) },
    from, rpc, storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: null }) }) },
  };
}`;

async function answerCurrent(page) {
  const choices = page.getByRole('group', { name: 'Choix de réponse' }).getByRole('button');
  if (await choices.count()) return choices.first().click();
  const input = page.getByPlaceholder(/./).first();
  if (await input.count()) {
    await input.fill('2');
    return page.getByRole('button', { name: 'Valider' }).click();
  }
  const selects = page.locator('form select');
  for (let i = 0; i < (await selects.count()); i++) await selects.nth(i).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Valider' }).click();
}

const signIn = (page, id, role = 'student') =>
  page.evaluate(([id, role]) => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ user: { id } }));
    localStorage.setItem('__fake_role', role);
  }, [id, role]);
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);

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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_SUPABASE }));
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && errors.push(m.text()));
    const bridgeLoads = [];
    page.on('request', (r) => r.url().endsWith('/js/solfege-bridge.js') && bridgeLoads.push(r.url()));

    console.log('• Visiteur non connecté');
    await page.goto(`${base}/solfege/`);
    await page.waitForURL(`${base}/#/connexion?retour=solfege`);
    check(true, 'solfège réservé aux élèves connectés');
    check(bridgeLoads.length === 0, 'le pont vers le compte n’est pas chargé sans connexion');

    console.log('• Élève connecté au Lab');
    await signIn(page, STUDENT);
    // Séance d'un autre élève sur le même appareil : ne doit jamais partir dans ce compte.
    await page.evaluate((other) => {
      const key = 'solfege-progression:note-reading:history:v1';
      const list = JSON.parse(localStorage.getItem(key) ?? '[]');
      const now = new Date().toISOString();
      list.push({ v: 1, id: 'autre-eleve', mode: 'training', clefChoice: 'treble', level: 'n1', answerMode: 'buttons', startedAt: now, finishedAt: now, total: 5, correct: 5, averageMs: 900, bestStreak: 5, items: [], owner: other });
      localStorage.setItem(key, JSON.stringify(list));
    }, OTHER);
    await page.goto(`${base}/solfege/`);
    await page.locator('[data-mpl-account="connecte"]').waitFor();
    check(true, 'message « ton formateur voit tes résultats »');
    if (shots) await page.screenshot({ path: join(shots, 'solfege-connecte.png'), fullPage: false });

    await page.goto(`${base}/solfege/laboratoires/rythme/`);
    await page.getByRole('button', { name: /^Évaluation/ }).click();
    for (let i = 0; i < 10; i++) {
      await page.getByText(`Question ${i + 1}/10`).waitFor();
      await answerCurrent(page);
    }
    await page.getByText('Évaluation terminée').waitFor();
    const mine = (await store(page, 'solfege-progression:quiz:rythme:history:v1')).find((s) => s.owner === STUDENT);
    check(mine && mine.total === 10 && mine.finishedAt, 'séance marquée au nom de l’élève');

    console.log('• Test de niveau');
    await page.goto(`${base}/solfege/test-de-positionnement/`);
    await page.getByRole('button', { name: /Commencer/ }).first().click();
    for (let i = 0; i < 40 && !(await page.getByText('Ton niveau estimé').count()); i++) {
      await answerCurrent(page);
      const next = page.getByRole('button', { name: /Question suivante|Suivant/ });
      if (await next.count()) await next.first().click();
      await page.waitForTimeout(50);
    }
    await page.getByText('Ton niveau estimé').waitFor();
    const outbox = await store(page, 'mpl:solfege:placement-outbox:v1');
    check(outbox?.length === 1 && outbox[0].owner === STUDENT, 'test de niveau mis en attente pour le compte');
    check(!(await page.getByText(/enregistré sur ton compte/i).count()), 'aucun faux message « enregistré »');

    // Le pont envoie au chargement d'une page du solfège.
    await page.goto(`${base}/solfege/tableau-de-bord/`);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('__fake_db') ?? '[]').length >= 2, null, { timeout: 10000 });
    let rows = await store(page, '__fake_db');
    check(bridgeLoads.length > 0, 'pont chargé sur les pages du solfège');
    check(rows.every((r) => r.user_id === STUDENT), 'uniquement des séances de l’élève connecté');
    check(rows.some((r) => r.lab === 'rythme' && r.mode === 'evaluation' && r.total === 10 && Object.keys(r.skills).length > 0), 'évaluation de rythme envoyée avec le détail');
    check(rows.some((r) => r.lab === 'positionnement' && r.mode === 'placement'), 'test de niveau envoyé');
    check(!rows.some((r) => r.client_id.includes('autre-eleve')), 'séance de l’autre élève non envoyée');
    check(rows.length === 2, `2 séances envoyées (obtenu ${rows.length})`);
    check(((await store(page, 'mpl:solfege:placement-outbox:v1')) ?? []).length === 0, 'file d’attente du test de niveau vidée après envoi');

    console.log('• Pas de renvoi inutile');
    const before = await store(page, '__fake_upserts');
    await page.goto(`${base}/#/tableau-de-bord`);
    await page.locator('#solfege-zone h2').waitFor();
    await page.waitForTimeout(300);
    check((await store(page, '__fake_upserts')) === before, 'séances déjà envoyées : pas de nouvel envoi');

    console.log('• Tableau de bord de l’élève');
    const zone = page.locator('#solfege-zone');
    await zone.getByText('Rythme').first().waitFor();
    const text = await zone.innerText();
    check(text.includes('Test de niveau'), 'niveau du test affiché');
    check(/Dernière évaluation : \d+\/10/.test(text), 'dernière évaluation affichée');
    if (shots) await zone.screenshot({ path: join(shots, 'lab-eleve-solfege.png') });

    console.log('• Fiche élève côté formateur');
    await signIn(page, TRAINER, 'trainer');
    await page.goto(`${base}/#/formateur/eleve/${STUDENT}`);
    await page.reload();
    const tzone = page.locator('#solfege-zone');
    await tzone.getByText('Rythme').first().waitFor();
    const ttext = await tzone.innerText();
    check(ttext.includes('Dernières séances') && /10\/10|\d+\/10/.test(ttext), 'séances de l’élève visibles par le formateur');
    check(!ttext.includes('Ouvrir le solfège'), 'pas de lien élève sur la fiche formateur');
    if (shots) await page.screenshot({ path: join(shots, 'lab-formateur-fiche.png'), fullPage: true });

    console.log('• Table pas encore créée');
    await signIn(page, STUDENT);
    await page.evaluate(() => {
      localStorage.setItem('__fake_missing', '1');
      localStorage.removeItem('__fake_db');
    });
    await page.evaluate((s) => localStorage.removeItem(`mpl:solfege-synced:v1:${s}`), STUDENT);
    await page.goto(`${base}/#/tableau-de-bord`);
    await page.reload();
    await page.locator('#solfege-zone').getByText('pas encore activé').waitFor();
    check((await store(page, `mpl:solfege-synced:v1:${STUDENT}`)) === null, 'rien n’est noté « envoyé » quand la base refuse');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 1, `pas de défilement horizontal (${overflow}px)`);
    check(errors.length === 0, `erreurs console : ${errors.slice(0, 5).join(' | ')}`);
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
    console.log(failures ? `\n${failures} échec(s)` : '\nTout est bon.');
    process.exit(failures ? 1 : 0);
  });
