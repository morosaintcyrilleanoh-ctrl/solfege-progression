/**
 * Vérifie l'Harmonie et les Accords au piano de Music Progression Lab :
 * page Harmonie (8 leçons), leçon avec exemples et exercices, toutes les questions
 * des 8 leçons (bonne réponse présente, choix distincts, textes complets),
 * dictionnaire d'accords sur le clavier (notes allumées, renversements),
 * « Joue l'accord » au clavier (correction), « Reconnais l'accord », les 12
 * tonalités, enregistrement des résultats, suivi formateur, barre du bas ;
 * message clair si la base n'est pas prête.
 *
 * Usage : node scripts/e2e-mpl-harmonie.mjs <dossier-music-progression-lab>
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8799;
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

// Joue au clavier l'accord demandé (« Joue Ré mineur (Dm) ») ; wrong = des notes fausses
async function playAsked(page, { wrong = false } = {}) {
  const stage = page.locator('#ear-stage');
  await stage.locator('[data-action="check"]').waitFor();
  const prompt = await stage.locator('.ex-prompt').innerText();
  const keys = await page.evaluate(async ([prompt, wrong]) => {
    const T = await import('/js/harmony/theory.js');
    const sym = prompt.match(/\(([^)]+)\)\s*$/)[1];
    for (const r of T.ROOTS.concat([{ letter: 1, acc: -1 }])) for (const ty of T.TYPE_IDS) {
      const c = T.chord(r, ty);
      if (c.symbol === sym) return wrong ? [61, 62, 63] : c.pcs.map((p) => 60 + p);
    }
    return null;
  }, [prompt, wrong]);
  if (!keys) throw new Error(`accord introuvable : ${prompt}`);
  for (const k of keys) await stage.locator(`.ear-key[data-key="${k}"]`).click();
  await stage.locator('[data-action="check"]').click();
  await stage.locator('[data-action="next"]').waitFor();
  return prompt;
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
    const browser = await chromium.launch({ executablePath, args: ['--autoplay-policy=no-user-gesture-required'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_SUPABASE }));
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|MEDIA_ERR|NotSupportedError|no supported source/i.test(m.text()) && errors.push(m.text()));

    console.log('• Page Harmonie');
    await page.goto(`${base}/`);
    await signIn(page, STUDENT, 'student');
    await open(page, '#/harmonie');
    check((await page.locator('#tabbar a').count()) === 5, 'barre du bas : 5 boutons');
    check((await page.locator('#tabbar a[aria-current="page"]').innerText()).includes('Harmonie'), 'onglet « Harmonie » actif');
    const hub = await page.locator('#main').innerText();
    for (const w of ['Les intervalles', 'Construire un accord', 'Les accords d’une gamme', 'Tonique, sous-dominante, dominante', 'Les renversements', 'Les cadences', 'Progressions célèbres', 'Les accords de 7e', 'Accords au piano'])
      check(hub.includes(w), `page Harmonie : « ${w} »`);
    check((await page.locator('#main a[href^="#/harmonie/lecon/"]').count()) === 8, '8 leçons');
    if (shots) await page.screenshot({ path: join(shots, 'harmonie-accueil.png'), fullPage: true });

    console.log('• Toutes les questions des 8 leçons et des entraînements');
    const audit = await page.evaluate(async () => {
      const { LESSONS } = await import('/js/harmony/lessons.js');
      const { PRACTICE } = await import('/js/harmony/practice.js');
      const bad = [];
      let n = 0;
      for (const a of [...LESSONS, ...PRACTICE.filter((p) => p.id === 'accords-oreille')]) {
        for (let level = 1; level <= a.levels; level++) {
          for (let i = 0; i < 40; i++) {
            const Q = a.quiz(level, i + 1);
            n++;
            const vals = Q.choices.map((c) => c.value), labels = Q.choices.map((c) => c.text);
            const why = Q.explain(Q.answer);
            const problems = [
              !vals.includes(String(Q.answer)) && 'réponse absente',
              new Set(vals).size !== vals.length && 'valeurs en double',
              new Set(labels).size !== labels.length && 'libellés en double',
              (vals.length < 2 || vals.length > (a.id === 'accords-oreille' ? 6 : 4) || (vals.length === 2 && !(a.id === 'accords-oreille' && level === 1))) && `${vals.length} choix`,
              /\{|undefined|NaN/.test(Q.prompt + labels.join() + why + (Q.tip ?? '')) && 'texte incomplet',
            ].filter(Boolean);
            if (problems.length) bad.push(`${a.id} niv. ${level} : ${problems.join(', ')} — ${Q.prompt} | ${labels.join(' / ')} | ${why}`);
          }
        }
      }
      return { n, bad: bad.slice(0, 5) };
    });
    check(audit.bad.length === 0, `${audit.n} questions générées sans problème ${audit.bad.join(' || ')}`);

    console.log('• Une leçon : explication, exemples, exercices');
    await open(page, '#/harmonie/lecon/harmonie-accords');
    const lesson = await page.locator('.harm-lesson').innerText();
    check(lesson.includes('tierce') && lesson.includes('Do – Mi♭ – Sol'), 'leçon « Construire un accord » expliquée');
    check((await page.locator('[data-example]').count()) === 4, '4 exemples à écouter');
    await page.locator('[data-example]').first().click();
    check((await page.locator('[data-level]').count()) === 3 && (await page.locator('[data-level]:disabled').count()) === 2, '3 niveaux, seul le 1er est ouvert');
    if (shots) await page.screenshot({ path: join(shots, 'harmonie-lecon.png'), fullPage: true });
    await page.locator('#ear-start').click();
    await page.locator('.choice').first().waitFor({ timeout: 15000 });
    check(/Quelles notes forment .+ (majeur|mineur) \?/.test(await page.locator('.ex-prompt').innerText()), 'question : les notes d’un accord');
    await finish(page);
    await page.locator('#again').waitFor();
    let data = await db(page);
    let r = data.ear_results?.find((x) => x.activity === 'harmonie-accords');
    check(r && r.total === 8 && r.level === 1 && r.kind === 'activite', 'résultat de la leçon enregistré (8 questions)');
    check((await page.locator('#ear-stage', { hasText: 'Résultat enregistré' }).count()) === 1, '« Résultat enregistré » affiché');

    console.log('• Accords au piano : le clavier');
    await open(page, '#/accords');
    check((await page.locator('[data-root]').count()) === 12 && (await page.locator('[data-type]').count()) === 16, '12 notes de départ, 16 types d’accords');
    const lit = () => page.evaluate(() => [...document.querySelectorAll('#chord-view .ear-key.is-on')].map((k) => k.textContent.trim()).join(' '));
    check((await lit()) === 'Do Mi Sol' && (await page.locator('#chord-view h2').innerText()).includes('Do majeur'), 'Do majeur : Do Mi Sol allumés');
    await page.locator('[data-root]', { hasText: 'Mi♭' }).click();
    await page.locator('[data-type="m7"]').click();
    check((await page.locator('#chord-view h2').innerText()).includes('Mi♭ mineur 7 (Ebm7)'), 'titre « Mi♭ mineur 7 (Ebm7) »');
    const ebm7 = await lit();
    check(['Mi♭', 'Sol♭', 'Si♭', 'Ré♭'].every((n) => ebm7.includes(n)) && ebm7.split(' ').length === 4, `Mi♭m7 : 4 notes bien écrites (${ebm7})`);
    await page.locator('#chord-inv').click();
    check((await page.locator('#chord-view').innerText()).includes('1er renversement') && (await page.locator('#chord-view').innerText()).includes('À la basse : Sol♭'), '1er renversement, Sol♭ à la basse');
    await page.locator('[data-type="9"]').click();
    await page.locator('[data-root]', { hasText: /^Si$/ }).click();
    check((await page.locator('#chord-view .ear-key.is-on').count()) === 5, 'Si 9 : 5 notes visibles sur le clavier');
    await page.locator('[data-play="arp"]').click();
    check((await page.locator('.ear-tile[href^="#/accords/entrainement/"]').count()) === 4, '4 entraînements');
    if (shots) await page.screenshot({ path: join(shots, 'accords-clavier.png'), fullPage: true });

    console.log('• Joue l’accord (au clavier)');
    await open(page, '#/accords/entrainement/accords-jouer');
    await page.locator('#ear-start').click();
    await playAsked(page, { wrong: true });
    check((await page.locator('.feedback.is-ko').count()) === 1 && (await page.locator('#ear-stage .ear-key.is-ko').count()) > 0, 'mauvaises notes : correction en rouge');
    check((await page.locator('#ear-stage .ear-key.is-on').count()) >= 3, 'les bonnes notes sont montrées');
    check((await page.locator('[data-action="replay"]').count()) === 1, 'bouton « Réécouter l’exercice »');
    if (shots) await page.screenshot({ path: join(shots, 'accords-jouer.png'), fullPage: false });
    await page.locator('[data-action="next"]').click();
    for (let q = 2; q <= 8; q++) {
      await playAsked(page);
      check((await page.locator('.feedback.is-ok').count()) === 1, `question ${q} : bonnes notes acceptées`);
      await page.locator('[data-action="next"]').click();
    }
    await page.locator('#again').waitFor();
    data = await db(page);
    r = data.ear_results?.find((x) => x.activity === 'accords-jouer');
    check(r && r.correct === 7 && r.total === 8, `résultat 7/8 enregistré (${r?.correct}/${r?.total})`);

    console.log('• Reconnais l’accord, les 12 tonalités');
    await open(page, '#/accords/entrainement/accords-nom');
    await page.locator('#ear-start').click();
    await page.locator('#ear-stage .choice').first().waitFor();
    check((await page.locator('#ear-stage .ear-key.is-on').count()) === 3, 'accord allumé sur le clavier');
    await finish(page);
    await page.locator('#again').waitFor();
    await open(page, '#/accords/entrainement/accords-tonalites');
    check((await page.locator('#adaptive').count()) === 0, 'pas de difficulté automatique pour le tour des 12 tonalités');
    await page.locator('#ear-start').click();
    const order = [];
    for (let q = 1; q <= 12; q++) {
      order.push((await playAsked(page)).replace('Joue ', '').replace(/ majeur.*/, ''));
      await page.locator('[data-action="next"]').click();
    }
    check(order.join(' ') === 'Do Sol Ré La Mi Si Fa♯ Ré♭ La♭ Mi♭ Si♭ Fa', `cycle des quintes (${order.join(' ')})`);
    await page.locator('#again').waitFor();
    data = await db(page);
    check(data.ear_results?.some((x) => x.activity === 'accords-tonalites' && x.correct === 12 && x.total === 12), '12/12 enregistré');

    console.log('• Accueil, menu, suivi formateur');
    await open(page, '#/');
    check((await page.locator('a.feature[href="#/harmonie"]').count()) === 1 && (await page.locator('a.feature[href="#/accords"]').count()) === 1, 'accueil : cartes Harmonie et Accords au piano');
    await signIn(page, TRAINER, 'trainer');
    await open(page, `#/formateur/eleve/${STUDENT}`);
    await page.locator('#ear-zone').getByText('Construire un accord').first().waitFor({ timeout: 10000 });
    const zone = await page.locator('#ear-zone').innerText();
    check(zone.includes('Joue l’accord') && zone.includes('Toutes les tonalités'), 'fiche élève : résultats harmonie et accords');

    console.log('• Menu sur ordinateur : jamais sur le titre');
    for (const w of [1280, 1366, 1440, 1600, 1920]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(150);
      const m = await page.evaluate(() => {
        const brand = document.querySelector('.brand').getBoundingClientRect();
        const links = [...document.querySelectorAll('#nav-links > *')].map((x) => x.getBoundingClientRect()).filter((r) => r.width && getComputedStyle(document.getElementById('nav-links')).display !== 'none');
        const b = document.querySelector('.brand');
        return { overlap: b.scrollWidth > b.clientWidth + 1 || links.some((r) => r.left < brand.right && r.top < brand.bottom), overflow: document.documentElement.scrollWidth - innerWidth, folded: getComputedStyle(document.getElementById('nav-toggle')).display !== 'none' };
      });
      check(!m.overlap && m.overflow <= 1, `${w}px : menu ${m.folded ? 'replié' : 'complet'}, sans chevauchement`);
    }
    await page.setViewportSize({ width: 390, height: 844 });

    console.log('• Base pas encore prête');
    await signIn(page, STUDENT, 'student');
    await page.evaluate(() => localStorage.setItem('__fake_missing', '1'));
    await open(page, '#/harmonie/lecon/harmonie-cadences');
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
