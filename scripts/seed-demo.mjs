/**
 * Création (facultative) de comptes et d'un cours de démonstration.
 *
 * Sécurité :
 *  - à lancer UNIQUEMENT sur votre ordinateur, jamais dans le navigateur ni sur Vercel ;
 *  - la clé secrète est lue dans la variable d'environnement SUPABASE_SECRET_KEY
 *    (jamais écrite dans le code ni dans le dépôt) ;
 *  - les mots de passe sont générés aléatoirement et affichés UNE seule fois ;
 *  - les comptes créés sont un formateur et un élève (aucun administrateur) ;
 *  - rien n'est fait sans l'option --confirmer.
 *
 * Usage :
 *   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_xxx \
 *   node scripts/seed-demo.mjs --confirmer
 *
 * Pour supprimer ensuite les comptes de démonstration : Supabase > Authentication > Users.
 */
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const domain = process.env.DEMO_EMAIL_DOMAIN ?? 'demo.solfege-progression.local';

if (!process.argv.includes('--confirmer')) {
  console.log('Ce script crée un formateur, un élève et un cours de démonstration.');
  console.log('Relancez-le avec --confirmer pour continuer.');
  process.exit(0);
}
if (!url || !secret) {
  console.error('Variables manquantes : SUPABASE_URL et SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const password = () => `${randomBytes(12).toString('base64url')}9a`;
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function createUser(email, first_name, last_name) {
  const pwd = password();
  const { data, error } = await supabase.auth.admin.createUser({ email, password: pwd, email_confirm: true, user_metadata: { first_name, last_name } });
  if (error || !data?.user) throw new Error(`Création de ${email} impossible : ${error?.message ?? 'réponse vide'}`);
  return { id: data.user.id, email, password: pwd };
}

async function insert(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error || !data) throw new Error(`Insertion dans ${table} impossible : ${error?.message ?? 'réponse vide'}`);
  return data;
}

async function main() {
  const trainer = await createUser(`formateur@${domain}`, 'Formateur', 'Démo');
  const student = await createUser(`eleve@${domain}`, 'Élève', 'Démo');
  // Le profil est créé automatiquement (rôle élève) ; on promeut le formateur.
  const { error: roleError } = await supabase.from('profiles').update({ role: 'trainer' }).eq('id', trainer.id);
  if (roleError) throw new Error(`Rôle formateur : ${roleError.message}`);

  const course = await insert('courses', {
    owner_id: trainer.id,
    title: 'Découverte du solfège (démo)',
    slug: `decouverte-demo-${randomBytes(3).toString('hex')}`,
    description: 'Cours de **démonstration** : la portée, les clés et les premières notes.',
    level: 'debutant',
    status: 'published',
    is_open: true,
  });
  const mod = await insert('modules', { course_id: course.id, title: 'La portée et les clés', position: 1, status: 'published', required_level: 'debutant' });
  await insert('lessons', {
    module_id: mod.id,
    title: 'La portée',
    summary: 'Cinq lignes et quatre interlignes.',
    content: '# La portée\nLa portée compte **5 lignes** et **4 interlignes**, numérotés de bas en haut.\n\n- Les notes se placent sur les lignes ou dans les interlignes.\n- Les lignes supplémentaires prolongent la portée.\n\nEntraîne-toi ensuite dans le laboratoire de lecture des notes.',
    position: 1,
    status: 'published',
    duration_minutes: 10,
  });
  await insert('lessons', {
    module_id: mod.id,
    title: 'La clé de sol',
    summary: 'La clé de sol indique le Sol sur la 2e ligne.',
    content: '## La clé de sol\nElle s’enroule autour de la **2e ligne** : la note sur cette ligne est un **Sol**.\n\nLignes : Mi – Sol – Si – Ré – Fa.\nInterlignes : Fa – La – Do – Mi.',
    position: 2,
    status: 'published',
    duration_minutes: 15,
  });
  const exercise = await insert('exercises', { owner_id: trainer.id, course_id: course.id, title: 'Quiz : la portée (démo)', kind: 'practice', status: 'draft' });
  const q = await insert('exercise_questions', {
    exercise_id: exercise.id,
    position: 1,
    type: 'mcq',
    skill: 'lecture.notes',
    prompt: 'Quelle note est sur la 2e ligne en clé de sol ?',
    notation: { kind: 'notes', clef: 'treble', notes: [{ letter: 'G', accidental: 0, octave: 4 }], layout: 'melodic' },
    choices: [{ id: 'c1', label: 'Mi' }, { id: 'c2', label: 'Sol' }, { id: 'c3', label: 'Si' }],
  });
  await insert('exercise_question_keys', { question_id: q.id, correct: ['c2'], explanation: 'La clé de sol s’enroule autour de la 2e ligne : Sol.' });
  const { error: pubError } = await supabase.from('exercises').update({ status: 'published' }).eq('id', exercise.id);
  if (pubError) throw new Error(`Publication de l’exercice : ${pubError.message}`);
  await insert('enrollments', { course_id: course.id, user_id: student.id, enrolled_by: trainer.id });
  const group = await insert('groups', { trainer_id: trainer.id, name: 'Groupe de démonstration' });
  await insert('group_members', { group_id: group.id, user_id: student.id });

  console.log('\nComptes de démonstration créés. Notez ces mots de passe maintenant : ils ne seront plus affichés.\n');
  console.log(`  Formateur : ${trainer.email}  /  ${trainer.password}`);
  console.log(`  Élève     : ${student.email}  /  ${student.password}`);
  console.log(`\nCours : ${course.title} (/cours/${course.slug})`);
}

main().catch((e) => {
  console.error(`\nÉchec : ${e.message}\nAucune donnée n’a été annulée automatiquement : vérifiez dans Supabase.`);
  process.exit(1);
});
