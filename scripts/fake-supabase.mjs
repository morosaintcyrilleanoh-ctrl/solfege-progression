/**
 * Faux serveur Supabase pour les tests d'affichage des espaces connectés.
 *
 * Il imite le strict nécessaire de l'API (Auth : /auth/v1/user ; PostgREST :
 * lecture filtrée des tables, insertions, mises à jour, fonctions ; Storage :
 * liens signés). Il NE vérifie PAS les droits : les règles d'accès sont
 * testées sur un vrai PostgreSQL par `npm run test:db`. Son rôle est de
 * vérifier que chaque page s'affiche sans erreur avec des données réalistes.
 */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const USERS = {
  admin: { id: ID(1), email: 'admin@test.local' },
  trainer: { id: ID(2), email: 'formateur@test.local' },
  student: { id: ID(3), email: 'eleve@test.local' },
};
const S2 = ID(4);
const now = Date.now();
const iso = (d) => new Date(now + d * 3600_000).toISOString();

const profile = (id, first_name, last_name, role, level = 'debutant', extra = {}) => ({
  id, first_name, last_name, role, level, instrument: 'Piano', musical_background: 'Chorale paroissiale', goals: 'Lire les partitions',
  country: 'Côte d’Ivoire', weekly_goal: 100, placement: null, is_active: true, created_at: iso(-500), updated_at: iso(-10), ...extra,
});

const C1 = ID(101), M1 = ID(201), M2 = ID(202), L1 = ID(301), L2 = ID(302), E1 = ID(401), G1 = ID(501), A1 = ID(601), LV1 = ID(701), LV2 = ID(702);
const Q1 = ID(801), Q2 = ID(802), Q3 = ID(803);

export const db = {
  profiles: [
    profile(USERS.admin.id, 'Anoh', 'Cyrille', 'admin', 'avance'),
    profile(USERS.trainer.id, 'Awa', 'Koné', 'trainer', 'avance'),
    profile(USERS.student.id, 'Aya', 'Traoré', 'student', 'debutant', { placement: { level: 'debutant', scores: { lecture: { correct: 2, total: 4 } } } }),
    profile(S2, 'Moussa', 'Diallo', 'student', 'intermediaire'),
  ],
  courses: [
    { id: C1, owner_id: USERS.trainer.id, title: 'Solfège débutant', slug: 'solfege-debutant', description: '# Bienvenue\nUn cours pour **bien commencer**.\n- La portée\n- Les clés', level: 'debutant', status: 'published', is_open: true, position: 0, published_at: iso(-200), created_at: iso(-300), updated_at: iso(-5) },
    { id: ID(102), owner_id: USERS.trainer.id, title: 'Brouillon', slug: 'brouillon', description: '', level: 'intermediaire', status: 'draft', is_open: false, position: 1, published_at: null, created_at: iso(-30), updated_at: iso(-2) },
  ],
  modules: [
    { id: M1, course_id: C1, title: 'La portée et les clés', description: 'Premiers repères', position: 1, status: 'published', required_level: 'debutant', created_at: iso(-300), updated_at: iso(-5) },
    { id: M2, course_id: C1, title: 'Intervalles', description: '', position: 2, status: 'published', required_level: 'intermediaire', created_at: iso(-300), updated_at: iso(-5) },
  ],
  lessons: [
    { id: L1, module_id: M1, title: 'La clé de sol', summary: 'Repérer les notes', content: '## La portée\nCinq lignes, quatre interlignes.\n\n1. Mi\n2. Sol\n\n[Plus](https://fr.wikipedia.org/wiki/Port%C3%A9e)', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_minutes: 15, position: 1, status: 'published', created_at: iso(-300), updated_at: iso(-5) },
    { id: L2, module_id: M1, title: 'La clé de fa', summary: '', content: 'Texte', video_url: null, duration_minutes: null, position: 2, status: 'published', created_at: iso(-300), updated_at: iso(-5) },
  ],
  lesson_resources: [
    { id: ID(901), lesson_id: L1, title: 'Fiche de la clé de sol', kind: 'pdf', storage_path: `${C1}/${L1}/fiche.pdf`, external_url: null, size_bytes: 230000, downloadable: true, position: 0, created_at: iso(-10) },
    { id: ID(902), lesson_id: L1, title: 'Vidéo complémentaire', kind: 'link', storage_path: null, external_url: 'https://example.org/video', size_bytes: null, downloadable: true, position: 1, created_at: iso(-10) },
  ],
  exercises: [
    { id: E1, owner_id: USERS.trainer.id, course_id: C1, lesson_id: null, title: 'Quiz de la clé de sol', description: 'Réponds sans aide.', kind: 'assessment', max_attempts: 3, status: 'published', created_at: iso(-50), updated_at: iso(-5) },
  ],
  exercise_questions: [
    { id: Q1, exercise_id: E1, position: 1, type: 'mcq', skill: 'lecture.notes', prompt: 'Quelle est cette note en clé de sol ?', notation: { kind: 'notes', clef: 'treble', notes: [{ letter: 'G', accidental: 0, octave: 4 }], layout: 'melodic' }, choices: [{ id: 'c1', label: 'Sol' }, { id: 'c2', label: 'La' }], answer_kind: null, created_at: iso(-50) },
    { id: Q2, exercise_id: E1, position: 2, type: 'short', skill: 'rythme.equivalences', prompt: 'Combien de croches dans une blanche pointée ?', notation: { kind: 'rhythm', timeSignature: { beats: 3, unit: 4 }, measures: [[{ value: 'half', dots: 1 }]] }, choices: null, answer_kind: 'number', created_at: iso(-50) },
    { id: Q3, exercise_id: E1, position: 3, type: 'match', skill: 'rythme.durees', prompt: 'Associe chaque figure à sa durée.', notation: null, choices: { left: ['Ronde', 'Blanche'], right: ['2 temps', '4 temps'] }, answer_kind: null, created_at: iso(-50) },
  ],
  exercise_question_keys: [
    { question_id: Q1, correct: ['c1'], explanation: 'Sol est sur la 2e ligne.' },
    { question_id: Q2, correct: ['6'], explanation: 'Six croches.' },
    { question_id: Q3, correct: ['4 temps', '2 temps'], explanation: '' },
  ],
  enrollments: [{ id: ID(1001), course_id: C1, user_id: USERS.student.id, status: 'active', enrolled_by: USERS.trainer.id, enrolled_at: iso(-100) }],
  groups: [{ id: G1, trainer_id: USERS.trainer.id, name: 'Groupe du samedi', description: 'Abidjan', created_at: iso(-100) }],
  group_members: [{ group_id: G1, user_id: USERS.student.id, added_at: iso(-100) }, { group_id: G1, user_id: S2, added_at: iso(-90) }],
  exercise_attempts: [
    ...Array.from({ length: 6 }, (_, i) => ({ id: ID(1100 + i), user_id: USERS.student.id, source: 'lab', exercise_id: null, assignment_id: null, lab_id: 'rythme', mode: i % 2 ? 'evaluation' : 'training', score: 3 + i, max_score: 10, details: { skills: { 'rythme.syncopes': { c: 1, t: 4 }, 'rythme.durees': { c: 5, t: 6 } } }, client_session_id: `s${i}`, started_at: iso(-i * 20), completed_at: iso(-i * 20), created_at: iso(-i * 20) })),
    { id: ID(1110), user_id: USERS.student.id, source: 'exercise', exercise_id: E1, assignment_id: A1, lab_id: null, mode: 'evaluation', score: 2, max_score: 3, details: {}, client_session_id: null, started_at: iso(-3), completed_at: iso(-3), created_at: iso(-3) },
    { id: ID(1111), user_id: S2, source: 'lab', exercise_id: null, assignment_id: null, lab_id: 'tonalites', mode: 'training', score: 9, max_score: 10, details: null, client_session_id: 'x', started_at: iso(-5), completed_at: iso(-5), created_at: iso(-5) },
  ],
  learning_progress: [{ user_id: USERS.student.id, lesson_id: L1, status: 'in_progress', progress_percent: 40, last_position: { scroll: 0.4 }, started_at: iso(-20), completed_at: null, updated_at: iso(-2) }],
  module_unlocks: [],
  assignments: [
    { id: A1, created_by: USERS.trainer.id, title: 'Devoir : clé de sol', instructions: 'Fais le quiz et **envoie une photo** de ta lecture.', group_id: G1, student_id: null, course_id: C1, lesson_id: L1, exercise_id: E1, due_at: iso(48), status: 'published', created_at: iso(-10), updated_at: iso(-10) },
    { id: ID(602), created_by: USERS.trainer.id, title: 'Devoir rythme', instructions: '', group_id: G1, student_id: null, course_id: null, lesson_id: null, exercise_id: null, due_at: null, status: 'published', created_at: iso(-9), updated_at: iso(-9) },
  ],
  assignment_submissions: [
    { id: ID(1201), assignment_id: A1, student_id: USERS.student.id, content: 'Voici mon travail.', attachment_path: `${A1}/${USERS.student.id}/photo.jpg`, attempt_id: ID(1110), status: 'submitted', score: null, feedback: null, reviewed_by: null, reviewed_at: null, submitted_at: iso(-3), updated_at: iso(-3) },
  ],
  live_sessions: [
    { id: LV1, trainer_id: USERS.trainer.id, title: 'Live : lecture de notes', description: 'On lit ensemble.', starts_at: iso(30), duration_minutes: 60, meeting_url: 'https://meet.jit.si/solfege-progression-test', replay_url: null, replay_path: null, audience: 'group', course_id: null, group_id: G1, status: 'scheduled', created_at: iso(-10), updated_at: iso(-10) },
    { id: LV2, trainer_id: USERS.trainer.id, title: 'Live passé : rythme', description: '', starts_at: iso(-72), duration_minutes: 45, meeting_url: null, replay_url: 'https://example.org/replay', replay_path: `${LV2}/replay.mp4`, audience: 'all', course_id: null, group_id: null, status: 'completed', created_at: iso(-100), updated_at: iso(-70) },
  ],
  announcements: [
    { id: ID(1301), author_id: USERS.admin.id, title: 'Bienvenue sur Solfège Progression', body: 'Bonne rentrée à tous !', audience: 'all', course_id: null, group_id: null, status: 'published', published_at: iso(-24), created_at: iso(-24) },
    { id: ID(1302), author_id: USERS.trainer.id, title: 'Brouillon', body: 'À venir', audience: 'course', course_id: C1, group_id: null, status: 'draft', published_at: null, created_at: iso(-2) },
  ],
  pedagogical_comments: [{ id: ID(1401), student_id: USERS.student.id, author_id: USERS.trainer.id, body: 'Très bon travail sur la clé de sol. Revois les syncopes.', context: 'Lecture', created_at: iso(-6) }],
  platform_settings: [
    { key: 'site.name', value: 'Solfège Progression', updated_by: null, updated_at: iso(-100) },
    { key: 'signup.open', value: true, updated_by: null, updated_at: iso(-100) },
    { key: 'student.default_weekly_goal', value: 100, updated_by: null, updated_at: iso(-100) },
  ],
};

export const INVITE_CODE = 'SOLFEGE2026';

const RPC = {
  signup_requires_invite: () => true,
  get_invite_code: () => INVITE_CODE,
  set_invite_code: (args) => String(args?.p_code ?? '').trim().toUpperCase() || null,
  admin_overview: () => ({ students: 2, trainers: 1, admins: 1, inactive: 0, courses_published: 1, courses_draft: 1, enrollments: 1, attempts_7d: 8, active_students_7d: 2, submissions_pending: 1, lives_upcoming: 1 }),
  admin_list_users: () =>
    db.profiles.map((p) => ({ id: p.id, email: Object.values(USERS).find((u) => u.id === p.id)?.email ?? 'moussa@test.local', first_name: p.first_name, last_name: p.last_name, role: p.role, level: p.level, is_active: p.is_active, created_at: p.created_at, total: db.profiles.length })),
  submit_exercise_attempt: (args) => ({
    attempt_id: randomUUID(),
    score: 2,
    max_score: 3,
    results: db.exercise_question_keys.map((k) => ({ question_id: k.question_id, correct: k.question_id !== Q2, expected: k.correct, explanation: k.explanation })),
    received: args,
  }),
};

/** Filtres PostgREST élémentaires : eq, neq, in, is, not.is, gt, gte, lt, lte. */
function applyFilters(rows, params) {
  let out = rows;
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue;
    const not = raw.startsWith('not.');
    const value = not ? raw.slice(4) : raw;
    const [op, ...rest] = value.split('.');
    const arg = rest.join('.');
    const test = (v) => {
      switch (op) {
        case 'eq': return String(v) === arg;
        case 'neq': return String(v) !== arg;
        case 'is': return arg === 'null' ? v == null : String(v) === arg;
        case 'in': return arg.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(v));
        case 'gt': return String(v) > arg;
        case 'gte': return String(v) >= arg;
        case 'lt': return String(v) < arg;
        case 'lte': return String(v) <= arg;
        default: return true;
      }
    };
    out = out.filter((r) => (not ? !test(r[key]) : test(r[key])));
  }
  const limit = Number(params.get('limit'));
  return limit ? out.slice(0, limit) : out;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

export function startFakeSupabase(port) {
  const requests = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString() || 'null') : null;
    requests.push({ method: req.method, path: url.pathname, search: url.search });
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');

    if (url.pathname === '/auth/v1/user') {
      const user = Object.values(USERS).find((u) => u.id === token);
      if (!user) return send(res, 401, { code: 'bad_jwt', message: 'invalid JWT' });
      return send(res, 200, { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, app_metadata: {}, user_metadata: {}, created_at: iso(-500) });
    }
    if (url.pathname === '/auth/v1/admin/users' && req.method === 'POST') {
      const id = randomUUID();
      return send(res, 200, { id, email: body?.email, aud: 'authenticated', role: 'authenticated', user_metadata: body?.user_metadata ?? {}, app_metadata: {} });
    }
    // Inscription : la base refuse un code d'invitation incorrect (message générique de Supabase).
    if (url.pathname === '/auth/v1/signup' && req.method === 'POST') {
      if (String(body?.data?.invite_code ?? '').toUpperCase() !== INVITE_CODE)
        return send(res, 500, { code: 'unexpected_failure', message: 'Database error saving new user' });
      return send(res, 200, { id: randomUUID(), email: body?.email, aud: 'authenticated', role: 'authenticated', user_metadata: body?.data ?? {}, app_metadata: {}, created_at: iso(0) });
    }
    if (url.pathname.startsWith('/auth/v1/')) return send(res, 200, {});

    if (url.pathname.startsWith('/storage/v1/object/sign/')) {
      return send(res, 200, { signedURL: `/object/sign/fake?token=abc` });
    }
    if (url.pathname.startsWith('/storage/v1/')) return send(res, 200, []);

    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    if (rpc) {
      const fn = RPC[rpc[1]];
      return send(res, 200, fn ? fn(body) : null);
    }

    const m = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
    if (m && !(m[1] in db) && req.method !== 'GET') db[m[1]] = [];
    if (!m || !(m[1] in db)) return send(res, 404, { message: 'not found' });
    const table = db[m[1]];
    const single = (req.headers.accept ?? '').includes('vnd.pgrst.object');
    const count = (req.headers.prefer ?? '').includes('count=exact');

    if (req.method === 'GET' || req.method === 'HEAD') {
      const rows = applyFilters(table, url.searchParams);
      const headers = count ? { 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` } : {};
      if (req.method === 'HEAD') return send(res, 200, undefined, headers);
      if (single) {
        if (rows.length !== 1) return send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows` });
        return send(res, 200, rows[0], headers);
      }
      return send(res, 200, rows, headers);
    }
    // Écritures : renvoient les lignes « modifiées » pour que l'interface affiche le succès.
    const list = Array.isArray(body) ? body : [body ?? {}];
    const rows = list.map((r) => ({ id: randomUUID(), ...r }));
    if (req.method === 'POST') table.push(...rows);
    return send(res, req.method === 'POST' ? 201 : 200, single ? rows[0] : rows);
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, requests })));
}

/** Cookie de session reconnu par @supabase/ssr pour un utilisateur fictif. */
export function sessionCookie(userKey) {
  const user = USERS[userKey];
  const session = {
    access_token: user.id,
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
  };
  return `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
}

export const IDS = { C1, M1, L1, E1, G1, A1, LV1, LV2, S2 };
