/**
 * Vérifie l'oreille musicale de Music Progression Lab (nouvelles activités) :
 * page Oreille, vrai piano enregistré, dictée mélodique (clavier), dictée rythmique
 * (écritures dessinées), cadences, instruments, difficulté qui s'adapte, voix (micro
 * simulé et mode sans micro), tempo qui accélère, polyrythmie, défi du jour et
 * classement, examen chronométré et certificat PDF, programme de 30 jours, accordeur,
 * suivi formateur ; message clair si la base n'est pas prête.
 *
 * Usage : node scripts/e2e-mpl-oreille.mjs <dossier-music-progression-lab> [jspdf.umd.min.js]
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8798;
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
const TRAINER = '00000000-0000-4000-8000-0000000000f1';

// supabase-js (CDN) remplacé par une petite base en mémoire (stockage local). Les règles
// d'accès réelles sont testées sur PostgreSQL (music-progression-lab/scripts/test-db.sh).
const FAKE_SUPABASE = `
const ls = localStorage;
const uid = () => { const k = Object.keys(ls).find((k) => /^sb-.+-auth-token$/.test(k)); return k ? JSON.parse(ls.getItem(k)).user.id : null; };
const load = () => JSON.parse(ls.getItem('__db') ?? '{}');
const save = (db) => ls.setItem('__db', JSON.stringify(db));
const missing = (table) => ls.getItem('__fake_missing') === '1' && (table.startsWith('solfege_') || table.startsWith('ear_'));
const MISSING = { code: 'PGRST205', message: 'Could not find the table' };
const DEFAULTS = { solfege_lesson_progress: () => ({ student_id: uid(), done_at: new Date().toISOString() }), ear_results: () => ({ user_id: uid(), kind: 'activite' }), ear_program_progress: () => ({ user_id: uid(), done_at: new Date().toISOString() }) };
export function createClient() {
  function from(table) {
    const filters = [];
    let op = 'select', payload = null, single = false, embed = /lessons:solfege_lessons/, conflict = null;
    let wantsEmbed = false, wantsCohort = false;
    const match = (r) => filters.every(([k, kind, v]) => kind === 'eq' ? r[k] === v : kind === 'in' ? v.includes(r[k]) : r[k] == null);
    const run = () => {
      if (missing(table)) return { data: null, error: MISSING };
      const db = load();
      const rows = db[table] ?? [];
      if (op === 'upsert') {
        const keys = (conflict ?? 'id').split(',');
        const list = (Array.isArray(payload) ? payload : [payload]);
        const out = [];
        for (const r of list) {
          const i = rows.findIndex((x) => keys.every((k) => x[k] === r[k]));
          if (i >= 0) { rows[i] = { ...rows[i], ...r }; out.push(rows[i]); }
          else { const n = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }; rows.push(n); out.push(n); }
        }
        db[table] = rows; save(db);
        return { data: single ? out[0] : out, error: null };
      }
      if (op === 'insert') {
        if (table === 'solfege_memberships') {
          const c = (db.solfege_cohorts ?? []).find((x) => x.id === payload.cohort_id);
          if (c && rows.filter((m) => m.cohort_id === c.id).length >= c.capacity) return { data: null, error: { code: '23514', message: 'Session complète.' } };
        }
        const list = (Array.isArray(payload) ? payload : [payload]).map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), position: 0, ...(DEFAULTS[table]?.() ?? {}), ...r }));
        if (table === 'ear_program_progress' && list.some((n) => rows.some((r) => r.program === n.program && r.day === n.day && r.user_id === n.user_id))) return { data: null, error: { code: '23505', message: 'duplicate' } };
        if (table === 'solfege_lesson_progress' && list.some((n) => rows.some((r) => r.lesson_id === n.lesson_id && r.student_id === n.student_id))) return { data: null, error: { code: '23505', message: 'duplicate' } };
        db[table] = [...rows, ...list]; save(db);
        return { data: single ? list[0] : list, error: null };
      }
      if (op === 'update') {
        const out = [];
        db[table] = rows.map((r) => (match(r) ? (out.push({ ...r, ...payload }), { ...r, ...payload }) : r)); save(db);
        return { data: single ? out[0] : out, error: null };
      }
      if (op === 'delete') {
        const gone = rows.filter(match).map((r) => r.id);
        db[table] = rows.filter((r) => !match(r));
        if (table === 'solfege_courses') { const ls2 = (db.solfege_lessons ?? []).filter((l) => gone.includes(l.course_id)).map((l) => l.id); db.solfege_lessons = (db.solfege_lessons ?? []).filter((l) => !gone.includes(l.course_id)); db.solfege_resources = (db.solfege_resources ?? []).filter((r) => !ls2.includes(r.lesson_id)); }
        if (table === 'solfege_lessons') db.solfege_resources = (db.solfege_resources ?? []).filter((r) => !gone.includes(r.lesson_id));
        save(db);
        return { data: null, error: null };
      }
      if (table === 'profiles' && single) {
        const id = filters.find((f) => f[0] === 'id')?.[2];
        const role = id === uid() ? (ls.getItem('__fake_role') ?? 'student') : 'student';
        return { data: { id, full_name: role === 'trainer' ? 'Anoh Cyrille' : 'Awa Koné', role, level: 1, xp: 40, voice_range: 'grave' }, error: null };
      }
      let out = rows.filter(match);
      if (wantsEmbed) out = out.map((c) => ({ ...c, lessons: (db.solfege_lessons ?? []).filter((l) => l.course_id === c.id) }));
      if (wantsCohort) out = out.map((m) => ({ ...m, cohort: (db.solfege_cohorts ?? []).find((c) => c.id === m.cohort_id) ?? null }));
      if (table === 'solfege_lives') out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      if (table === 'solfege_resources' || table === 'solfege_sessions') out.sort((a, b) => (b.created_at ?? b.started_at).localeCompare(a.created_at ?? a.started_at));
      return { data: single ? out[0] ?? null : out, count: out.length, error: null };
    };
    const q = {
      select: (cols) => { if (typeof cols === 'string' && embed.test(cols)) wantsEmbed = true; if (typeof cols === 'string' && /cohort:solfege_cohorts/.test(cols)) wantsCohort = true; return q; },
      insert: (r) => ((op = 'insert'), (payload = r), q), update: (r) => ((op = 'update'), (payload = r), q), delete: () => ((op = 'delete'), q),
      upsert: (r, opts) => ((op = 'upsert'), (payload = r), (conflict = opts?.onConflict ?? null), q),
      eq: (k, v) => (filters.push([k, 'eq', v]), q), in: (k, v) => (filters.push([k, 'in', v]), q), is: (k) => (filters.push([k, 'is']), q),
      order: () => q, limit: () => q, gte: () => q, neq: () => q, or: () => q,
      maybeSingle: async () => ((single = true), run()), single: async () => ((single = true), run()),
      then: (ok, ko) => Promise.resolve(run()).then(ok, ko),
    };
    return q;
  }
  const storage = { from: (bucket) => ({
    upload: async (path, file) => {
      if (ls.getItem('__fake_missing') === '1') return { data: null, error: { message: 'Bucket not found' } };
      const files = JSON.parse(ls.getItem('__files') ?? '{}'); files[bucket + '/' + path] = file.type; ls.setItem('__files', JSON.stringify(files));
      return { data: { path }, error: null };
    },
    remove: async (paths) => { const files = JSON.parse(ls.getItem('__files') ?? '{}'); for (const p of paths) delete files[bucket + '/' + p]; ls.setItem('__files', JSON.stringify(files)); return { error: null }; },
    createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: '/__fake_file/' + p })), error: null }),
    createSignedUrl: async (p) => ({ data: { signedUrl: '/__fake_file/' + p }, error: null }),
  }) };
  async function rpc(name, args = {}) {
    if (name === 'staff_student_list') return { data: [{ id: '${STUDENT}', full_name: 'Awa Koné', email: 'awa@exemple.fr', joined_at: new Date().toISOString(), level: 1, xp: 40 }], error: null };
    if (name === 'my_trainers') return { data: [{ id: '${TRAINER}', full_name: 'Anoh Cyrille' }], error: null };
    if (name === 'get_trainer_code') return { data: 'ANOH-2026', error: null };
    if (name === 'ear_leaderboard') {
      const rows = (load().ear_results ?? []).filter((r) => r.kind === 'defi');
      const best = {};
      for (const r of rows) { const k = r.user_id + '|' + r.day; best[k] = Math.max(best[k] ?? 0, r.correct); }
      const tot = {};
      for (const [k, v] of Object.entries(best)) { const u = k.split('|')[0]; tot[u] ??= { points: 0, days: 0 }; tot[u].points += v; tot[u].days++; }
      const list = Object.entries(tot).sort((a, b) => b[1].points - a[1].points).map(([u, v], i) => ({ rank: i + 1, name: u === '${STUDENT}' ? 'Awa' : 'Yao', points: v.points, days: v.days, is_me: u === uid() }));
      return { data: list, error: null };
    }
    if (name === 'solfege_cohort_seats') { const ms = load().solfege_memberships ?? []; return { data: args.p_ids.map((id) => ({ cohort_id: id, taken: ms.filter((m) => m.cohort_id === id).length })), error: null }; }
    return { data: name.startsWith('my_') ? [] : null, error: null };
  }
  const session = () => (uid() ? { access_token: 'x', user: { id: uid(), email: 'x@exemple.fr', user_metadata: {} } } : null);
  return {
    auth: { getSession: async () => ({ data: { session: session() } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}) },
    from, rpc, storage,
  };
}`;

const JSPDF = process.argv[3] ? readFileSync(process.argv[3], 'utf8') : null;
const signIn = (page, id, role) =>
  page.evaluate(([id, role]) => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ user: { id } }));
    localStorage.setItem('__fake_role', role);
  }, [id, role]);
const db = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__db') ?? '{}'));
async function open(page, hash) {
  await page.goto(`${base}/?r=${Math.random()}${hash}`);
  await page.locator('#main h1').first().waitFor();
}

// Répond à la question en cours (au hasard), puis passe à la suivante. Renvoie false à la fin.
async function answerOne(page, root = '#ear-stage') {
  const stage = page.locator(root);
  const nextBtn = stage.locator('[data-action="next"]');
  for (let i = 0; i < 200; i++) {
    if (await nextBtn.count()) { await nextBtn.click({ timeout: 3000 }).catch(() => {}); return true; }
    const check = stage.locator('[data-action="check"]');
    if (await check.count() && !(await check.isDisabled().catch(() => true))) { await check.click(); continue; }
    const key = stage.locator('.ear-key.white:not([disabled])').first();
    if (await key.count() && await check.count() && await check.isDisabled()) { await key.click(); continue; }
    const choice = stage.locator('.choice:not([disabled])').first();
    if (await choice.count()) { await choice.click({ timeout: 3000 }).catch(() => {}); continue; }
    const same = stage.getByRole('button', { name: /Pareil|C’était pareil|Identique/ }).first();
    if (await same.count()) { await same.click(); continue; }
    const skip = stage.locator('[data-action="skip"]').first();
    if (await skip.count()) { await skip.click({ timeout: 2000 }).catch(() => {}); continue; }
    if (await stage.locator('#again, #cert, a[href="#/oreille/defi"], a[href="#/oreille/examens"]').count()) return false;
    await page.waitForTimeout(150);
  }
  throw new Error('question bloquée');
}
async function finish(page, root) {
  for (let i = 0; i < 60 && (await answerOne(page, root)); i++);
}

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
    const browser = await chromium.launch({ executablePath, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce', permissions: ['microphone'], acceptDownloads: true });
    await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_SUPABASE }));
    if (JSPDF) await context.route('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm', (route) => route.fulfill({ contentType: 'application/javascript', body: `${JSPDF}\nexport const jsPDF = globalThis.jspdf.jsPDF;` }));
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|MEDIA_ERR|NotSupportedError|no supported source/i.test(m.text()) && errors.push(m.text()));
    const pianoRequests = [];
    page.on('request', (r) => /\/assets\/piano\/.*\.mp3$/.test(r.url()) && pianoRequests.push(r.url()));

    console.log('• Page Oreille');
    await page.goto(`${base}/`);
    await signIn(page, STUDENT, 'student');
    await open(page, '#/oreille');
    check((await page.locator('#tabbar a[aria-current="page"]').innerText()).includes('Oreille'), 'onglet « Oreille » actif');
    const hub = await page.locator('#main').innerText();
    for (const w of ['Défi du jour', 'Dictée mélodique', 'Dictée rythmique', 'Cadences', 'Reconnaître les instruments', 'Chanter un intervalle', 'Chanter une gamme', 'Solfège chanté', 'Tempo qui accélère', 'Polyrythmie', 'Examens et certificats', 'Accordeur et diapason', '30 jours d’oreille', 'Programme chanteurs', 'Programme accompagnateurs', '30 jours de rythme'])
      check(hub.toLowerCase().includes(w.toLowerCase()), `page Oreille : « ${w} »`);
    if (shots) await page.screenshot({ path: join(shots, 'oreille-accueil.png'), fullPage: true });

    console.log('• Dictée mélodique (clavier) + piano enregistré');
    await open(page, '#/oreille/activite/dictee-melodique');
    check((await page.locator('[data-level]').count()) === 4 && (await page.locator('[data-level]:disabled').count()) === 3, '4 niveaux, seuls le 1er est ouvert');
    await page.locator('#ear-start').click();
    await page.locator('.ear-keys').waitFor();
    check((await page.locator('.ear-slot').count()) === 3 && (await page.locator('.ear-slot.is-given').count()) === 1, '3 cases, la 1re note donnée');
    check((await page.locator('.ear-key.black').count()) === 5 && (await page.locator('.ear-key.white').count()) === 8, 'clavier Do–Do avec touches noires');
    await page.locator('.ear-key.white').nth(2).click();
    check((await page.locator('.ear-slot.is-filled').count()) === 2, 'une touche remplit la case suivante');
    await page.locator('[data-action="undo"]').click();
    check((await page.locator('.ear-slot.is-filled').count()) === 1, '« Effacer » enlève la dernière note');
    if (shots) await page.screenshot({ path: join(shots, 'oreille-dictee-melodique.png'), fullPage: false });
    await page.waitForFunction(() => import('/js/audio.js').then((m) => m.pianoLoaded()), null, { timeout: 15000 });
    check(pianoRequests.length === 21, `piano enregistré : 21 notes chargées (${pianoRequests.length})`);
    await finish(page);
    await page.locator('#again').waitFor();
    let data = await db(page);
    let r = data.ear_results?.find((x) => x.activity === 'dictee-melodique');
    check(r && r.total === 6 && r.level === 1 && r.kind === 'activite', 'résultat de la dictée enregistré (6 mélodies)');

    console.log('• Difficulté qui s’adapte (moteur)');
    const adapt = await page.evaluate(async () => {
      const { runQuiz } = await import('/js/ear/engine.js');
      const stage = document.createElement('div');
      document.querySelector('#main').appendChild(stage);
      const seen = [];
      const p = runQuiz(stage, { total: 7, level: 1, maxLevel: 3, adaptive: true, makeQuestion: (level) => { seen.push(level); return { prompt: 'q', play: async () => {}, answer: 'a', choices: [{ value: 'a', label: 'A', text: 'A' }, { value: 'b', label: 'B', text: 'B' }] }; } });
      const plan = ['a', 'a', 'a', 'b', 'b', 'a', 'a'];
      for (const v of plan) {
        for (let i = 0; i < 100 && !stage.querySelector(`[data-action="choice:${v}"]:not([disabled])`); i++) await new Promise((r) => setTimeout(r, 20));
        stage.querySelector(`[data-action="choice:${v}"]`).click();
        for (let i = 0; i < 100 && !stage.querySelector('[data-action="next"]'); i++) await new Promise((r) => setTimeout(r, 20));
        stage.querySelector('[data-action="next"]').click();
      }
      const res = await p;
      stage.remove();
      return { seen, correct: res.correct, best: res.bestLevel };
    });
    check(adapt.seen.join('') === '1112211', `3 bonnes réponses → niveau 2, 2 erreurs → niveau 1 (${adapt.seen.join('')})`);

    console.log('• Dictée rythmique, cadences, instruments');
    await open(page, '#/oreille/activite/dictee-rythmique');
    await page.locator('#ear-start').click();
    await page.locator('.choice .ear-rhythm').first().waitFor({ timeout: 15000 });
    check((await page.locator('.choice .ear-rhythm').count()) === 4, '4 écritures rythmiques dessinées');
    const glyphFont = await page.evaluate(() => document.fonts.check('40px Bravura'));
    check(glyphFont, 'police musicale Bravura chargée');
    if (shots) await page.screenshot({ path: join(shots, 'oreille-dictee-rythmique.png'), fullPage: false });
    await finish(page);
    await open(page, '#/oreille/activite/cadences');
    await page.locator('#ear-start').click();
    await page.locator('.choice').first().waitFor({ timeout: 15000 });
    check((await page.locator('.choice').allInnerTexts()).join('|').includes('Cadence parfaite'), 'cadences : parfaite / demi-cadence');
    await finish(page);
    const inst = await page.evaluate(async () => {
      const { playInstrument, INSTRUMENTS } = await import('/js/ear/sounds.js');
      INSTRUMENTS.forEach((n, i) => playInstrument(n, 60 + i, i * 0.05, 0.3));
      await new Promise((r) => setTimeout(r, 900));
      return INSTRUMENTS.length;
    });
    check(inst === 8, '8 instruments jouent sans erreur');
    await open(page, '#/oreille/activite/instruments');
    await page.locator('#ear-start').click();
    await page.locator('.choice').first().waitFor({ timeout: 15000 });
    check((await page.locator('.choice').count()) === 3, 'instruments niveau 1 : piano, guitare, flûte');
    await finish(page);

    console.log('• Voix : micro simulé, puis sans micro');
    await open(page, '#/oreille/activite/chant-gamme');
    await page.locator('#ear-start').click();
    await page.getByRole('button', { name: /Utiliser le micro/ }).click();
    await page.locator('.ear-degree').first().waitFor();
    check((await page.locator('.ear-degree').count()) === 5, 'gamme niveau 1 : 5 degrés');
    await page.locator('.tuner').waitFor({ timeout: 10000 });
    if (shots) await page.screenshot({ path: join(shots, 'oreille-chant-gamme.png'), fullPage: false });
    await finish(page);
    data = await db(page);
    r = data.ear_results?.find((x) => x.activity === 'chant-gamme');
    check(r && r.total === 5 && Array.isArray(r.details.items) && r.details.items.length === 5, 'justesse enregistrée degré par degré');
    await open(page, '#/oreille/activite/solfege-chante');
    await page.locator('#ear-start').click();
    await page.locator('[data-action="self"]').click();
    await page.locator('.ear-staff').waitFor({ timeout: 10000 });
    check((await page.locator('.ear-staff text').count()) >= 4, 'portée dessinée (clé de sol + notes)');
    if (shots) await page.screenshot({ path: join(shots, 'oreille-solfege-chante.png'), fullPage: false });
    await finish(page);

    console.log('• Rythme : tempo qui accélère, polyrythmie');
    await open(page, '#/oreille/activite/tempo-progressif');
    await page.locator('#ear-start').click();
    await page.locator('[data-action="go"]').click();
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(820); if (await page.locator('[data-action="next"]').count()) break; }
    await page.locator('[data-action="next"]').waitFor({ timeout: 20000 });
    const tempoFb = await page.locator('.feedback').innerText();
    check(/temps justes sur 32/.test(tempoFb), `tempo : score sur 32 temps (« ${tempoFb.split('\n')[0]} »)`);
    await page.locator('[data-action="next"]').click();
    await page.locator('#again').waitFor();
    await open(page, '#/oreille/activite/polyrythmie');
    await page.locator('#ear-start').click();
    await page.locator('.choice').first().waitFor({ timeout: 15000 });
    check((await page.locator('.choice').allInnerTexts()).join('|').includes('2 contre 3'), 'polyrythmie : reconnaître « 2 contre 3 »');
    await finish(page);

    console.log('• Défi du jour et classement');
    await open(page, '#/oreille/defi');
    check((await page.locator('#ear-stage li').count()) === 5, 'défi : 5 thèmes du jour');
    await page.locator('#ear-start').click();
    await finish(page);
    await page.locator('a[href="#/oreille/defi"]').first().waitFor();
    data = await db(page);
    const defi = data.ear_results.filter((x) => x.kind === 'defi');
    check(defi.length === 1 && defi[0].total === 5, 'défi enregistré (5 questions)');
    await open(page, '#/oreille/defi');
    const board = await page.locator('.ear-board').innerText();
    check(/Awa \(toi\)/.test(board) && /pts/.test(board), 'classement : mon prénom et mes points');
    check((await page.locator('.sol-tag', { hasText: '1 jour de suite' }).count()) === 1, 'série : 1 jour de suite');
    await page.locator('#ear-start').click();
    await finish(page);
    check((await db(page)).ear_results.filter((x) => x.kind === 'defi').length === 1, 'un 2e essai ne compte pas pour le classement');
    if (shots) { await open(page, '#/oreille/defi'); await page.screenshot({ path: join(shots, 'oreille-defi.png'), fullPage: true }); }

    console.log('• Examen chronométré et certificat');
    await open(page, '#/oreille/examen/intervalles');
    await page.locator('#ear-start').click();
    await page.locator('[data-z="timer"]').waitFor();
    check(/⏱ 1[12]:\d\d/.test(await page.locator('[data-z="timer"]').innerText()), 'chronomètre de 12 minutes');
    await finish(page);
    data = await db(page);
    const ex = data.ear_results.find((x) => x.kind === 'examen');
    check(ex && ex.total === 20 && ex.passed === (ex.correct * 100 >= 20 * 70), `examen enregistré, réussite cohérente (${ex?.correct}/20)`);
    await page.evaluate((sid) => { const d = JSON.parse(localStorage.getItem('__db')); d.ear_results.push({ id: '3f2a9c1e-0000-4000-8000-000000000001', user_id: sid, activity: 'examen-accords', kind: 'examen', correct: 18, total: 20, passed: true, day: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString(), details: {} }); localStorage.setItem('__db', JSON.stringify(d)); }, STUDENT);
    await open(page, '#/oreille/examens');
    check((await page.locator('[data-cert]').count()) >= 1, 'certificat disponible pour un examen réussi');
    if (JSPDF) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-cert="3f2a9c1e-0000-4000-8000-000000000001"]').click()]);
      const path = await download.path();
      const pdf = readFileSync(path);
      check(pdf.slice(0, 5).toString() === '%PDF-' && download.suggestedFilename() === 'certificat-accords.pdf', `certificat PDF téléchargé (${download.suggestedFilename()}, ${pdf.length} octets)`);
      if (shots) { const { copyFileSync } = await import('node:fs'); copyFileSync(path, join(shots, 'certificat-exemple.pdf')); }
    }

    console.log('• Programme de 30 jours');
    await open(page, '#/oreille/programme/oreille-30');
    check((await page.locator('.ear-days li').count()) === 30, '30 jours');
    await page.locator('a.btn-lg', { hasText: 'Jour 1' }).click();
    await page.locator('#ear-start').click();
    for (let i = 0; i < 80; i++) {
      if (await page.locator('#ear-stage', { hasText: 'Jour 1 terminé' }).count()) break;
      await answerOne(page, '#ear-stage').catch(() => {});
    }
    await page.locator('#ear-stage', { hasText: 'Jour 1 terminé' }).waitFor({ timeout: 20000 });
    data = await db(page);
    check(data.ear_program_progress?.some((x) => x.program === 'oreille-30' && x.day === 1) && data.ear_results.filter((x) => x.kind === 'programme').length === 3, 'jour 1 terminé : 3 étapes enregistrées');
    await open(page, '#/oreille/programme/oreille-30');
    check((await page.locator('.ear-days li.is-done').count()) === 1 && (await page.locator('a.btn-lg', { hasText: 'Jour 2' }).count()) === 1, 'jour 2 débloqué');

    console.log('• Accordeur et diapason');
    await open(page, '#/oreille/accordeur');
    await page.getByRole('button', { name: /La 440/ }).click();
    await page.locator('[data-string]').first().click();
    await page.locator('#tn-toggle').click();
    await page.waitForTimeout(2500);
    check((await page.locator('#tn-toggle').innerText()).includes('Arrêter'), 'accordeur démarré avec le micro');
    await page.locator('#tn-toggle').click();
    if (shots) await page.screenshot({ path: join(shots, 'oreille-accordeur.png'), fullPage: true });

    console.log('• Suivi formateur');
    await signIn(page, TRAINER, 'trainer');
    await open(page, `#/formateur/eleve/${STUDENT}`);
    await page.locator('#ear-zone').getByText('Dictée mélodique').first().waitFor({ timeout: 10000 });
    const zone = await page.locator('#ear-zone').innerText();
    check(zone.includes('Défi du jour relevé 1 jour') && zone.includes('Examens et certificats') && zone.includes('30 jours d’oreille'), 'fiche élève : activités, défi, examens, programmes');
    if (shots) await page.locator('#ear-zone').screenshot({ path: join(shots, 'formateur-oreille.png') });
    const lead = await page.evaluate(() => [...document.querySelectorAll('#ear-zone .skill-head span:first-child')].map((x) => x.textContent).join('|'));
    check(lead.includes('Cadences'), 'détail par activité');

    console.log('• Base pas encore prête');
    await signIn(page, STUDENT, 'student');
    await page.evaluate(() => localStorage.setItem('__fake_missing', '1'));
    await open(page, '#/oreille/activite/cadences');
    await page.locator('#ear-start').click();
    await finish(page);
    check((await page.locator('#ear-stage .alert-info', { hasText: 'non enregistré' }).count()) === 1, 'résultat « non enregistré » si la base n’est pas prête');

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
