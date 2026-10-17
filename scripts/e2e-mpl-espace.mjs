/**
 * Vérifie l'espace Solfège de Music Progression Lab (formations, lives, ressources) :
 * le formateur crée une formation et ses leçons (vidéo, fichier joint), programme des
 * lives (lien Jitsi automatique ou son propre lien) et publie des ressources (fichier,
 * vidéo YouTube, texte) ; l'élève les retrouve, coche ses leçons, rejoint le live ;
 * le formateur voit la progression ; message clair si la base n'est pas prête.
 *
 * Usage : node scripts/e2e-mpl-espace.mjs <dossier-music-progression-lab>
 * Variable : SCREENSHOTS_DIR (captures d'écran facultatives).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dir = resolve(process.argv[2] ?? '../music-progression-lab');
const PORT = 8793;
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
// Image PNG 1×1 et faux MP3 servis pour les « liens temporaires » des fichiers.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

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
    let op = 'select', payload = null, single = false, embed = /lessons:solfege_lessons/;
    let wantsEmbed = false;
    const match = (r) => filters.every(([k, kind, v]) => kind === 'eq' ? r[k] === v : kind === 'in' ? v.includes(r[k]) : r[k] == null);
    const run = () => {
      if (missing(table)) return { data: null, error: MISSING };
      const db = load();
      const rows = db[table] ?? [];
      if (op === 'insert') {
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
      if (table === 'solfege_lives') out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      if (table === 'solfege_resources' || table === 'solfege_sessions') out.sort((a, b) => (b.created_at ?? b.started_at).localeCompare(a.created_at ?? a.started_at));
      return { data: single ? out[0] ?? null : out, count: out.length, error: null };
    };
    const q = {
      select: (cols) => { if (typeof cols === 'string' && embed.test(cols)) wantsEmbed = true; return q; },
      insert: (r) => ((op = 'insert'), (payload = r), q), update: (r) => ((op = 'update'), (payload = r), q), delete: () => ((op = 'delete'), q),
      upsert: async (rows) => { const db = load(); db[table] = [...(db[table] ?? []), ...rows]; save(db); return { error: null }; },
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
  async function rpc(name) {
    if (name === 'staff_student_list') return { data: [{ id: '${STUDENT}', full_name: 'Awa Koné', email: 'awa@exemple.fr', joined_at: new Date().toISOString(), level: 1, xp: 40 }], error: null };
    if (name === 'my_trainers') return { data: [{ id: '${TRAINER}', full_name: 'Anoh Cyrille' }], error: null };
    if (name === 'get_trainer_code') return { data: 'ANOH-2026', error: null };
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
    await context.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<body style="background:#000;color:#fff">vidéo</body>' }));
    await context.route('**/__fake_file/**', (route) =>
      route.request().url().endsWith('.png') ? route.fulfill({ contentType: 'image/png', body: PNG }) : route.fulfill({ contentType: 'audio/mpeg', body: Buffer.alloc(64) }),
    );
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|MEDIA_ERR|NotSupportedError|no supported source/i.test(m.text()) && errors.push(m.text()));

    console.log('• Formateur : formation et leçons');
    await page.goto(`${base}/`);
    await signIn(page, TRAINER, 'trainer');
    await open(page, '#/formateur/solfege');
    check((await page.locator('.tabs a[aria-current="page"]').innerText()).includes('Solfège'), 'onglet « Solfège » dans l’espace formateur');
    const cform = page.locator('#course-form');
    await cform.locator('button[type=submit]').click();
    check(await cform.getByText('titre', { exact: false }).count() > 0, 'titre obligatoire');
    await cform.getByLabel('Titre').fill('Solfège débutant');
    await cform.getByLabel('Description').fill('Les bases du solfège en 2 leçons.');
    await cform.locator('button[type=submit]').click();
    await page.getByRole('heading', { name: 'Ajouter une leçon' }).waitFor();
    const lform = page.locator('#lesson-form');
    await lform.getByLabel('Titre').fill('Les clés');
    await lform.getByLabel('Contenu de la leçon').fill('La clé de sol se place sur la 2e ligne.');
    await lform.getByLabel('Lien de la vidéo').fill('http://youtube.com/watch?v=abc');
    await lform.locator('button[type=submit]').click();
    check(await lform.getByText('https://').count() > 0, 'lien vidéo non https refusé');
    await lform.getByLabel('Lien de la vidéo').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await lform.getByLabel('Fichiers joints').setInputFiles({ name: 'gamme de do.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('ID3fake') });
    await lform.locator('button[type=submit]').click();
    await page.locator('#lessons').getByText('Les clés').waitFor();
    await page.locator('#lesson-form').getByLabel('Titre').fill('Les valeurs de notes');
    await page.locator('#lesson-form').getByLabel('Contenu de la leçon').fill('Ronde = 4 temps, blanche = 2, noire = 1.');
    await page.locator('#lesson-form button[type=submit]').click();
    await page.locator('#lessons').getByText('Les valeurs de notes').waitFor();
    let data = await db(page);
    check(data.solfege_lessons?.length === 2, '2 leçons enregistrées');
    check(data.solfege_resources?.some((r) => r.kind === 'audio' && r.title === 'gamme de do' && r.storage_path.startsWith(TRAINER + '/')), 'fichier audio joint à la leçon');
    if (shots) await page.screenshot({ path: join(shots, 'formateur-formation.png'), fullPage: true });

    console.log('• Formateur : lives');
    await open(page, '#/formateur/solfege?vue=lives');
    const vform = page.locator('#live-form');
    const soon = new Date(Date.now() + 5 * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    await vform.getByLabel('Titre').fill('Lecture de notes en clé de fa');
    await vform.getByLabel('Date').fill(`${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`);
    await vform.getByLabel('Heure').fill(`${pad(soon.getHours())}:${pad(soon.getMinutes())}`);
    await vform.getByRole('button', { name: 'Programmer le live' }).click();
    await page.locator('#live-list').getByText('Lecture de notes en clé de fa').waitFor();
    data = await db(page);
    check(/^https:\/\/meet\.jit\.si\/MusicProgressionLab-Lecturedenotesencledefa-\w+$/.test(data.solfege_lives[0].meeting_url), `lien Jitsi créé (${data.solfege_lives[0].meeting_url})`);
    const vform2 = page.locator('#live-form');
    await vform2.getByLabel('Titre').fill('Dictée rythmique');
    await vform2.getByLabel('Date').fill(`${soon.getFullYear() + 1}-01-15`);
    await vform2.getByLabel('Heure').fill('18:30');
    await vform2.getByText('Utiliser mon lien Zoom').click();
    await vform2.locator('input[name=url]').fill('zoom.us/j/123');
    await vform2.getByRole('button', { name: 'Programmer le live' }).click();
    check(await vform2.getByText('https://').count() > 0, 'lien Zoom sans https refusé');
    await vform2.locator('input[name=url]').fill('https://zoom.us/j/123456');
    await vform2.getByRole('button', { name: 'Programmer le live' }).click();
    await page.locator('#live-list').getByText('Dictée rythmique').waitFor();
    check((await db(page)).solfege_lives.some((l) => l.meeting_url === 'https://zoom.us/j/123456'), 'live avec mon lien Zoom');

    console.log('• Formateur : ressources');
    await open(page, '#/formateur/solfege?vue=ressources');
    let rform = page.locator('#res-form');
    await rform.getByLabel('Fichier', { exact: true }).setInputFiles({ name: 'virus.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') });
    await rform.getByRole('button', { name: 'Publier' }).click();
    check(await rform.getByText('Type de fichier non accepté').count() > 0, 'fichier .exe refusé');
    await rform.getByLabel('Fichier', { exact: true }).setInputFiles({ name: 'Tableau des clés.png', mimeType: 'image/png', buffer: PNG });
    await rform.getByRole('button', { name: 'Publier' }).click();
    await page.locator('#sol-my-res').getByText('Tableau des clés').waitFor();
    rform = page.locator('#res-form');
    await rform.getByLabel('Type').selectOption('video');
    await rform.getByLabel('Titre').fill('Battre la mesure à 3 temps');
    await rform.getByLabel('Lien de la vidéo').fill('https://youtu.be/dQw4w9WgXcQ');
    await rform.getByRole('button', { name: 'Publier' }).click();
    await page.locator('#sol-my-res').getByText('Battre la mesure').waitFor();
    rform = page.locator('#res-form');
    await rform.getByLabel('Type').selectOption('text');
    await rform.getByLabel('Titre').fill('Conseils pour lire plus vite');
    await rform.getByLabel('Texte').fill('Repère d’abord les notes de référence.');
    await rform.getByRole('button', { name: 'Publier' }).click();
    await page.locator('#sol-my-res').getByText('Conseils pour lire').waitFor();
    check((await db(page)).solfege_resources.filter((r) => !r.lesson_id).length === 3, '3 ressources publiées');
    await page.locator('#sol-my-res img[data-img]').evaluate((img) => new Promise((r) => (img.complete && img.naturalWidth ? r() : img.addEventListener('load', r))));
    check(true, 'image affichée côté formateur');
    if (shots) await page.screenshot({ path: join(shots, 'formateur-ressources.png'), fullPage: true });

    console.log('• Élève : accueil du solfège');
    await signIn(page, STUDENT, 'student');
    await page.goto(`${base}/solfege/`);
    await page.locator('#mpl-espace-widget[data-state="done"]').waitFor({ timeout: 10000 });
    const widget = await page.locator('#mpl-espace-widget').innerText();
    check(widget.includes('EN DIRECT') && widget.includes('Lecture de notes en clé de fa'), 'live en direct sur l’accueil du solfège');
    check(widget.includes('Solfège débutant') && widget.includes('0 leçon(s) terminée(s) sur 2'), 'formation affichée sur l’accueil du solfège');
    check((await page.locator('a[href="/#/espace-solfege/ressources"]').count()) === 1, 'cases Formations · Lives · Ressources');
    if (shots) await page.locator('#mpl-espace-widget').locator('xpath=..').screenshot({ path: join(shots, 'eleve-accueil-solfege.png') });

    console.log('• Élève : formation');
    await page.locator('#mpl-espace-widget a[href*="formation"]').click();
    await page.getByRole('heading', { name: 'Les clés' }).waitFor();
    check((await page.locator('#tabbar a[aria-current="page"]').innerText()).includes('Solfège'), 'onglet Solfège actif en bas');
    check((await page.locator('#sol-lesson iframe').getAttribute('src')) === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'vidéo YouTube intégrée');
    await page.locator('#sol-att [data-play]').click();
    await page.locator('#sol-att audio').waitFor();
    check((await page.locator('#sol-att audio').getAttribute('src')).includes('/__fake_file/'), 'fichier audio joint lu par lien temporaire');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-lecon.png'), fullPage: true });
    await page.getByRole('button', { name: /J’ai terminé/ }).click();
    await page.getByRole('heading', { name: 'Les valeurs de notes' }).waitFor();
    check((await page.locator('.sol-dot.is-done').count()) === 1, 'leçon 1 cochée, leçon 2 ouverte');
    check((await db(page)).solfege_lesson_progress?.[0]?.student_id === STUDENT, 'progression enregistrée pour l’élève');

    console.log('• Élève : lives et ressources');
    await open(page, '#/espace-solfege/lives');
    const liveNow = page.locator('.sol-live.is-now');
    check((await liveNow.count()) === 1 && /meet\.jit\.si/.test(await liveNow.getByRole('link').getAttribute('href')), 'bouton « Rejoindre le live » (Jitsi)');
    check((await page.locator('.sol-live').count()) === 2, '2 lives à venir');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-lives.png'), fullPage: true });
    await open(page, '#/espace-solfege/ressources');
    check((await page.locator('#sol-res > li').count()) === 3, '3 ressources visibles');
    await page.locator('[data-filter="image"]').click();
    check((await page.locator('#sol-res > li:not([hidden])').count()) === 1, 'filtre « Images »');
    await page.locator('#sol-res img[data-img]').evaluate((img) => new Promise((r) => (img.complete && img.naturalWidth ? r() : img.addEventListener('load', r))));
    await page.locator('[data-filter=""]').click();
    check((await page.locator('#sol-res iframe').count()) === 1, 'vidéo YouTube dans les ressources');
    if (shots) await page.screenshot({ path: join(shots, 'eleve-ressources.png'), fullPage: true });

    console.log('• Formateur : progression de l’élève');
    await signIn(page, TRAINER, 'trainer');
    await open(page, `#/formateur/eleve/${STUDENT}`);
    await page.locator('#solfege-zone').getByText('Solfège débutant').waitFor();
    check((await page.locator('#solfege-zone').innerText()).includes('1 leçon(s) terminée(s) sur 2'), 'fiche élève : formation 1/2');
    const courseId = (await db(page)).solfege_courses[0].id;
    await open(page, `#/formateur/solfege/${courseId}`);
    check((await page.locator('#lessons').innerText()).includes('terminée par Awa Koné'), 'leçon « terminée par Awa Koné »');
    await open(page, '#/formateur/solfege?vue=ressources');
    const before = Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem('__files') ?? '{}'))).length;
    await page.locator('#sol-my-res li[data-kind=image] [data-del]').click();
    await page.locator('#sol-my-res > li').nth(1).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('#sol-my-res > li').length === 2);
    const after = Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem('__files') ?? '{}'))).length;
    check(after === before - 1, 'supprimer une ressource supprime son fichier');

    console.log('• Base pas encore prête');
    await page.evaluate(() => localStorage.setItem('__fake_missing', '1'));
    await open(page, '#/formateur/solfege?vue=lives');
    await page.locator('#sol-tr .alert-info').waitFor();
    check(true, 'formateur : message « pas encore activé »');
    await signIn(page, STUDENT, 'student');
    await open(page, '#/espace-solfege/formations');
    await page.locator('#sol-zone .alert-info').waitFor();
    check(true, 'élève : message « pas encore activé »');

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
