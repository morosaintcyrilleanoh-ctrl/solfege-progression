/**
 * Vérifie la formation payante du volet Solfège de Music Progression Lab :
 * le formateur programme l'agenda (session de 3 mois, places limitées), ouvre l'accès
 * des élèves qui ont payé (+1 mois), publie un live (rediffusion YouTube), une formation
 * et un devoir réservés à la session ; l'élève retrouve sa formation, l'agenda, rend son
 * devoir (enregistrement audio de 2 min au plus), demande un coaching ; le formateur
 * valide le coaching (objectifs, rendez-vous) et corrige ; l'accès expiré se ferme.
 *
 * Usage : node scripts/e2e-mpl-formation.mjs <dossier-music-progression-lab>
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8797;
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
const missing = (table) => ls.getItem('__fake_missing') === '1' && table.startsWith('solfege_');
const MISSING = { code: 'PGRST205', message: 'Could not find the table' };
const DEFAULTS = { solfege_lesson_progress: () => ({ student_id: uid(), done_at: new Date().toISOString() }) };
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
const patchDb = (page, fn) => page.evaluate((src) => { const d = JSON.parse(localStorage.getItem('__db') ?? '{}'); new Function('d', src)(d); localStorage.setItem('__db', JSON.stringify(d)); }, fn);
async function open(page, hash) {
  await page.goto(`${base}/?r=${Math.random()}${hash}`);
  await page.locator('#main h1').first().waitFor();
}
const pad = (n) => String(n).padStart(2, '0');
const day = (offset) => { const d = new Date(Date.now() + offset * 86400000); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const firstOfNextMonth = () => { const d = new Date(); const n = new Date(d.getFullYear(), d.getMonth() + 1, 1); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`; };

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
    const browser = await chromium.launch({ executablePath, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce', permissions: ['microphone'] });
    await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_SUPABASE }));
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    await context.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<meta charset="utf-8"><body style="background:#0b2545;color:#fff">vidéo</body>' }));
    await context.route('**/__fake_file/**', (route) => route.fulfill({ contentType: 'application/pdf', body: Buffer.from('%PDF-1.4') }));
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|MEDIA_ERR|NotSupportedError|no supported source/i.test(m.text()) && errors.push(m.text()));

    console.log('• Formateur : agenda et sessions');
    await page.goto(`${base}/`);
    await signIn(page, TRAINER, 'trainer');
    await open(page, '#/formateur/solfege');
    check((await page.locator('.sol-chip[aria-pressed="true"]').innerText()).trim() === 'Agenda', 'onglet Solfège : « Agenda » par défaut');
    await page.locator('#wa').fill('+225 07 01 02 03 04');
    await page.locator('#wa-form button').click();
    await page.getByText('Enregistré').first().waitFor();
    const program = async (kind, title, date, places, months) => {
      const f = page.locator('#agenda-form');
      await f.locator('label.sol-chip-radio', { hasText: { formation: 'Formation', coaching: 'Coaching', evenement: 'Événement' }[kind] }).click();
      check(await f.locator(`input[name=kind][value=${kind}]`).isChecked(), `type « ${kind} » sélectionné`);
      await f.getByLabel('Titre').fill(title);
      await f.getByLabel('Date de début').fill(date);
      if (months) await f.getByLabel('Durée').selectOption(String(months));
      await f.getByLabel('Places').fill(String(places));
      await f.getByRole('button', { name: 'Ajouter à l’agenda' }).click();
      await page.getByText('Ajouté à l’agenda').first().waitFor();
      await page.locator('#agenda-form').waitFor();
    };
    await program('formation', 'Lire une partition', day(0), 30, 3);
    await program('formation', 'Atelier complet', day(10), 1, 1);
    await program('formation', 'Lire une partition · session 2', day(40), 30, 3);
    await program('evenement', 'Live d’information gratuit', day(5), '', null);
    let data = await db(page);
    const main = data.solfege_cohorts.find((c) => c.title === 'Lire une partition');
    check(main && main.capacity === 30 && main.ends_on === (() => { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth() + 3, d.getDate()); return `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`; })(), 'session de 3 mois, 30 places');
    check(data.solfege_events?.length === 1 && data.solfege_trainer_settings?.[0]?.whatsapp === '+225 07 01 02 03 04', 'événement et numéro WhatsApp enregistrés');
    if (shots) await page.screenshot({ path: join(shots, 'formateur-agenda.png'), fullPage: true });

    console.log('• Formateur : élèves qui ont payé');
    await open(page, `#/formateur/solfege/session/${main.id}`);
    await page.locator('#m-student').selectOption({ label: 'Awa Koné' });
    await page.getByRole('button', { name: 'A payé 1 mois' }).click();
    await page.getByText('Accès ouvert').first().waitFor();
    data = await db(page);
    const plus1 = (d0, n) => { const d = new Date(d0); const t = new Date(d.getFullYear(), d.getMonth() + n, 1); const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), last)); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
    check(data.solfege_memberships[0].paid_until === plus1(new Date(), 1), `accès payé 1 mois (${data.solfege_memberships[0].paid_until})`);
    await page.getByRole('button', { name: '+1 mois' }).click();
    await page.getByText('Accès prolongé').first().waitFor();
    check((await db(page)).solfege_memberships[0].paid_until === plus1(new Date(), 2), '« +1 mois » prolonge l’accès');
    if (shots) await page.screenshot({ path: join(shots, 'formateur-session.png'), fullPage: true });
    const full = data.solfege_cohorts.find((c) => c.title === 'Atelier complet');
    await open(page, `#/formateur/solfege/session/${full.id}`);
    await page.locator('#m-student').selectOption({ label: 'Awa Koné' });
    await page.getByRole('button', { name: 'A payé 1 mois' }).click();
    await page.getByText('Session complète : la place est prise.').first().waitFor();
    check((await page.locator('#member-form').count()) === 0, 'session pleine (1/1) : plus de formulaire d’ajout');

    console.log('• Formateur : contenu réservé à la session');
    await open(page, '#/formateur/solfege?vue=lives');
    let f = page.locator('#live-form');
    await f.getByLabel('Titre').fill('Semaine 1 : la portée');
    await f.getByLabel('Date').fill(day(1));
    await f.getByLabel('Heure').fill('20:00');
    await f.getByLabel('Pour').selectOption({ label: '⭐ Lire une partition' });
    await f.getByRole('button', { name: 'Programmer le live' }).click();
    await page.locator('#live-list').getByText('Semaine 1').waitFor();
    check((await db(page)).solfege_lives[0].cohort_id === main.id, 'live réservé à la session');
    await patchDb(page, "d.solfege_lives[0].starts_at = new Date(Date.now() - 2 * 86400000).toISOString();");
    await open(page, '#/formateur/solfege?vue=lives');
    await page.locator('#live-past input[name=url]').fill('https://youtu.be/dQw4w9WgXcQ');
    await page.locator('#live-past button[type=submit]').click();
    await page.getByText('Enregistré').first().waitFor();
    check((await db(page)).solfege_lives[0].replay_url === 'https://youtu.be/dQw4w9WgXcQ', 'lien YouTube de la rediffusion enregistré');
    await open(page, '#/formateur/solfege?vue=formations');
    f = page.locator('#course-form');
    await f.getByLabel('Titre').fill('Les bases de la lecture');
    await f.getByLabel('Pour').selectOption({ label: '⭐ Lire une partition' });
    await f.locator('button[type=submit]').click();
    await page.getByRole('heading', { name: 'Ajouter une leçon' }).waitFor();
    await page.locator('#lesson-form').getByLabel('Titre').fill('La portée et les clés');
    await page.locator('#lesson-form button[type=submit]').click();
    await page.locator('#lessons').getByText('La portée').waitFor();
    await open(page, '#/formateur/solfege?vue=devoirs');
    f = page.locator('#hw-form');
    await f.getByLabel('Titre').fill('Exercice de lecture n°4');
    await f.getByLabel('Consigne').fill('Lis les notes et chante-les en battant la mesure.');
    await f.getByLabel('À rendre avant le').fill(day(7));
    await f.getByLabel('Pour').selectOption({ label: '⭐ Lire une partition' });
    await f.getByLabel('Exercice à faire').setInputFiles({ name: 'exercice-4.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await f.getByRole('button', { name: 'Publier' }).click();
    await page.getByRole('link', { name: 'Voir les rendus' }).waitFor();
    data = await db(page);
    check(data.solfege_homework?.[0]?.cohort_id === main.id && data.solfege_resources?.some((r) => r.homework_id === data.solfege_homework[0].id && r.kind === 'pdf'), 'devoir de session avec son PDF');

    console.log('• Élève : ma formation');
    await signIn(page, STUDENT, 'student');
    await open(page, '#/espace-solfege');
    check((await page.locator('.sol-tile[aria-current="page"]').innerText()).includes('Ma formation'), '« Ma formation » ouverte par défaut pour un inscrit');
    const zoneText = await page.locator('#sol-zone').innerText();
    check(zoneText.includes('Lire une partition') && /Accès actif jusqu’au/.test(zoneText), 'session et accès affichés');
    check(zoneText.indexOf('Lire une partition') < zoneText.indexOf('Atelier complet'), 'session en cours affichée avant la session à venir');
    check((await page.locator('#sol-zone iframe').getAttribute('src')) === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'rediffusion YouTube intégrée');
    check(zoneText.includes('Les bases de la lecture') && zoneText.includes('1 devoir'), 'leçons et devoir de la session');
    check(!/\d+\s?(FCFA|€|\$)/.test(zoneText), 'aucun prix affiché');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-ma-formation.png'), fullPage: true });

    console.log('• Élève : agenda');
    await open(page, '#/espace-solfege/agenda');
    const ag = await page.locator('#sol-zone').innerText();
    check(ag.includes('Tu es inscrit') && ag.includes('30 places restantes sur 30') && ag.includes('Live d’information gratuit'), 'agenda : inscrit, places restantes, événement');
    const wa = await page.locator('#sol-zone a.sol-wa').first().getAttribute('href');
    check(wa.startsWith('https://wa.me/2250701020304?text=') && decodeURIComponent(wa).includes('session 2'), 'bouton « Je veux m’inscrire » vers le WhatsApp du formateur');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-agenda.png'), fullPage: true });

    console.log('• Élève : rendre un devoir');
    await open(page, '#/espace-solfege/devoirs');
    const hw = page.locator('[data-submit]').first();
    await hw.getByRole('button', { name: 'Rendre le devoir' }).click();
    check(await hw.getByText('Ajoute un fichier').count() > 0, 'rendu vide refusé');
    await hw.locator('[data-rec]').click();
    await page.waitForTimeout(2300);
    check((await hw.locator('[data-rec-status]').innerText()).includes('/ 2:00'), 'compteur « / 2:00 » pendant l’enregistrement');
    await hw.locator('[data-rec]').click();
    await hw.getByText('Enregistrement prêt').waitFor();
    await hw.getByLabel('Message pour mon formateur').fill('Voici ma lecture chantée.');
    await hw.getByRole('button', { name: 'Rendre le devoir' }).click();
    await page.getByText('Devoir rendu').first().waitFor();
    data = await db(page);
    const sub = data.solfege_submissions?.[0];
    check(sub?.kind === 'audio' && sub.storage_path.startsWith(`rendus/${STUDENT}/`), 'enregistrement audio envoyé dans le dossier de l’élève');
    // Limite de 2 minutes : on avance l'horloge de 121 s, l'enregistrement doit s'arrêter seul.
    const autoStop = await page.evaluate(async () => {
      const { audioRecorder } = await import('/js/pages/solfege-media.js');
      return new Promise((resolve) => {
        const realNow = Date.now.bind(Date);
        const rec = audioRecorder({ onTick: () => {}, onStop: (file, secs) => { Date.now = realNow; resolve({ secs, size: file.size }); } });
        rec.start().then(() => { Date.now = () => realNow() + 121000; });
        setTimeout(() => resolve({ secs: -1 }), 5000);
      });
    });
    check(autoStop.secs >= 120 && autoStop.secs < 130, `enregistrement arrêté automatiquement à 2 minutes (${autoStop.secs} s)`);
    if (shots) await page.screenshot({ path: join(shots, 'eleve-devoir.png'), fullPage: true });

    console.log('• Élève : demande de coaching');
    await open(page, '#/espace-solfege/coaching');
    const cf = page.locator('#coach-form');
    await cf.locator('label.sol-chip-radio', { has: page.locator('input[name=months][value="2"]') }).click();
    await cf.locator('label.sol-chip-radio', { has: page.locator(`input[name=start][value="${firstOfNextMonth()}"]`) }).click();
    await cf.getByLabel('Mon objectif').fill('Lire en clé de fa');
    await cf.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await page.locator('.sol-tag-warn', { hasText: 'Demande envoyée' }).waitFor({ timeout: 8000 }).catch(async () => { console.log('DEBUG', await page.locator('#sol-zone').innerText()); });
    data = await db(page);
    check(data.solfege_coachings?.[0]?.status === 'pending' && data.solfege_coachings[0].months === 2 && data.solfege_coachings[0].trainer_id === TRAINER, 'demande de coaching : 2 mois, en attente');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-coaching-demande.png'), fullPage: true });

    console.log('• Formateur : coaching et correction');
    await signIn(page, TRAINER, 'trainer');
    await open(page, '#/formateur/solfege?vue=coaching');
    await page.getByRole('button', { name: /Valider/ }).click();
    await page.getByText('Coaching validé').first().waitFor();
    data = await db(page);
    const coach = data.solfege_coachings[0];
    const endExpected = (() => { const s = new Date(firstOfNextMonth()); const e = new Date(s.getFullYear(), s.getMonth() + 2, 0); return `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`; })();
    check(coach.status === 'active' && coach.paid_until === endExpected, `coaching validé jusqu’à la fin du 2e mois (${coach.paid_until})`);
    await open(page, `#/formateur/solfege/coaching/${coach.id}`);
    await page.locator('#g-month').selectOption(firstOfNextMonth());
    await page.locator('#g-text').fill('Clé de fa : 5 minutes par jour');
    await page.getByRole('button', { name: /Ajouter l’objectif/ }).click();
    await page.getByText('Clé de fa : 5 minutes').waitFor();
    await page.locator('#r-date').fill(day(2));
    await page.locator('#r-time').fill('18:30');
    await page.getByRole('button', { name: 'Programmer le rendez-vous' }).click();
    await page.getByText('Rendez-vous programmé').first().waitFor();
    check((await db(page)).solfege_lives.some((l) => l.coaching_id === coach.id && /meet\.jit\.si/.test(l.meeting_url)), 'rendez-vous de coaching (lien Jitsi)');
    if (shots) await page.screenshot({ path: join(shots, 'formateur-coaching.png'), fullPage: true });
    const hwId = data.solfege_homework[0].id;
    await open(page, `#/formateur/solfege/devoir/${hwId}`);
    await page.locator('#subs [data-play-sub]').click();
    await page.locator('#subs audio').waitFor();
    await page.locator('#subs input[name=grade]').fill('16/20');
    await page.locator('#subs input[name=feedback]').fill('Très bonne justesse, attention au rythme mesure 3.');
    await page.getByRole('button', { name: 'Corriger' }).click();
    await page.getByText('Correction enregistrée').first().waitFor();
    check((await db(page)).solfege_submissions[0].grade === '16/20', 'devoir corrigé (note + commentaire)');

    console.log('• Élève : correction, coaching validé');
    await signIn(page, STUDENT, 'student');
    await open(page, '#/espace-solfege/devoirs');
    const corr = await page.locator('.sol-correction').innerText();
    check(corr.includes('16/20') && corr.includes('attention au rythme'), 'l’élève voit sa note et le commentaire');
    await open(page, '#/espace-solfege/coaching');
    const ct = await page.locator('#sol-zone').innerText();
    check(/Ton coaching commence le|Mois 1 sur 2/.test(ct) && ct.includes('Clé de fa : 5 minutes'), 'coaching : période et objectifs du mois');
    await page.locator('[data-goal]').check();
    await page.waitForTimeout(300);
    check((await db(page)).solfege_coaching_goals[0].done === true, 'l’élève coche son objectif');
    check((await page.locator('.sol-live').count()) === 1, 'rendez-vous visible par l’élève');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-coaching.png'), fullPage: true });

    console.log('• Accès expiré');
    await patchDb(page, `d.solfege_memberships.forEach((m) => { m.paid_until = '${day(-1)}'; });`);
    await open(page, '#/espace-solfege/ma-formation');
    await page.locator('.sol-locked').first().waitFor();
    const lock = await page.locator('.sol-locked').first().innerText();
    check(lock.includes('Ton accès a expiré'), 'accès expiré : formation fermée');
    check(/wa\.me\/2250701020304/.test(await page.locator('.sol-locked a').first().getAttribute('href')), 'bouton WhatsApp pour renouveler');
    check((await page.locator('.sol-locked iframe').count()) === 0, 'plus de rediffusion visible');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-expire.png'), fullPage: false });
    await open(page, '#/espace-solfege/formations');
    check((await page.locator('.sol-tile').count()) >= 6, 'le reste de l’espace solfège reste accessible');

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
