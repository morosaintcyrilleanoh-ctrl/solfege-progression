-- =============================================================================
-- Tests des règles d'accès et des fonctions sensibles.
-- Lancés par scripts/test-db.sh sur une base PostgreSQL temporaire.
-- Chaque échec interrompt le script avec un message « ÉCHEC ».
-- =============================================================================
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema tests;
grant usage on schema tests to authenticated, anon;
create table tests.results (n serial, label text);
grant insert, select on tests.results to authenticated, anon;
grant usage on sequence tests.results_n_seq to authenticated, anon;

create function tests.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then
    raise exception 'ÉCHEC : %', label;
  end if;
  insert into tests.results (label) values (label);
end;
$$;

-- Vérifie qu'une instruction est refusée.
create function tests.refused(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    insert into tests.results (label) values (label || ' (refusé : ' || left(sqlerrm, 60) || ')');
    return;
  end;
  raise exception 'ÉCHEC : % — l''instruction aurait dû être refusée', label;
end;
$$;

-- Nombre de lignes modifiées par une instruction (0 = filtrée par le RLS).
create function tests.affected(stmt text) returns integer language plpgsql as $$
declare n integer;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on all functions in schema tests to authenticated, anon;

-- ---------------------------------------------------------------- Données
-- Comptes : A admin, T1/T2 formateurs, S1/S2/S3 élèves
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local', '{"first_name":"Anoh","last_name":"Cyrille"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'formateur1@test.local', '{"first_name":"Awa"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'formateur2@test.local', '{"first_name":"Koffi"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'eleve1@test.local', '{"first_name":"Aya","role":"admin"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'eleve2@test.local', '{"first_name":"Moussa"}'),
  ('00000000-0000-0000-0000-0000000000e3', 'eleve3@test.local', '{"first_name":"Fatou"}');

select tests.ok((select count(*) = 6 from public.profiles), 'un profil est créé pour chaque compte');
select tests.ok((select bool_and(weekly_goal = 100) from public.profiles), 'objectif hebdomadaire par défaut appliqué');
select tests.ok((select role = 'student' from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'le rôle demandé dans les métadonnées d''inscription est ignoré (toujours élève)');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'trainer' where id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2');

insert into public.courses (id, owner_id, title, slug, status) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'Solfège débutant', 'solfege-debutant', 'published'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f2', 'Rythme', 'rythme', 'published'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000f1', 'Brouillon', 'brouillon', 'draft');
insert into public.courses (id, owner_id, title, slug, status, is_open) values
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000f2', 'Cours ouvert', 'cours-ouvert', 'published', true);

insert into public.modules (id, course_id, title, status, required_level) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Bases', 'published', 'debutant'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Avancé', 'published', 'intermediaire'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Mesures', 'published', 'debutant');

insert into public.lessons (id, module_id, title, content, status) values
  ('10000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'La portée', 'Contenu L1', 'published'),
  ('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Intervalles', 'Contenu L2', 'published'),
  ('10000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Brouillon', 'Contenu L3', 'draft'),
  ('10000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'La mesure', 'Contenu L4', 'published');

insert into public.lesson_resources (lesson_id, title, kind, storage_path) values
  ('10000000-0000-0000-0000-000000000001', 'Fiche L1', 'pdf', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000001/fiche.pdf'),
  ('10000000-0000-0000-0000-000000000002', 'Fiche L2', 'pdf', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000002/fiche.pdf');

insert into public.enrollments (course_id, user_id) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1');

insert into public.groups (id, trainer_id, name) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'Groupe du samedi'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f2', 'Groupe du dimanche');
insert into public.group_members (group_id, user_id) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e3');

insert into public.exercises (id, owner_id, course_id, title, status) values
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'c0000000-0000-0000-0000-000000000001', 'Quiz', 'published');
insert into public.exercise_questions (id, exercise_id, position, type, prompt, choices, answer_kind) values
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1, 'mcq', 'Q1', '[{"id":"c1","label":"A"},{"id":"c2","label":"B"}]', null),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 2, 'short', 'Q2', null, 'number'),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 3, 'short', 'Q3', null, 'text'),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 4, 'match', 'Q4', '{"left":["ronde","blanche"],"right":["4","2"]}', null);
insert into public.exercise_question_keys (question_id, correct, explanation) values
  ('f0000000-0000-0000-0000-000000000001', '["c2"]', 'B est juste'),
  ('f0000000-0000-0000-0000-000000000002', '["6"]', 'Six croches'),
  ('f0000000-0000-0000-0000-000000000003', '["Ré majeur"]', 'Deux dièses'),
  ('f0000000-0000-0000-0000-000000000004', '["4","2"]', 'Ronde = 4 temps');

insert into public.assignments (id, created_by, title, group_id, exercise_id, status) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'Devoir 1', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'published'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f1', 'Devoir brouillon', 'a0000000-0000-0000-0000-000000000001', null, 'draft');

insert into public.exercise_attempts (user_id, source, lab_id, score, max_score) values
  ('00000000-0000-0000-0000-0000000000e1', 'lab', 'rythme', 8, 10),
  ('00000000-0000-0000-0000-0000000000e2', 'lab', 'rythme', 5, 10),
  ('00000000-0000-0000-0000-0000000000e3', 'lab', 'tonalites', 7, 10);

insert into public.live_sessions (id, trainer_id, title, starts_at, meeting_url, audience, group_id) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'Live du groupe', now() + interval '2 days', 'https://meet.example.org/abc', 'group', 'a0000000-0000-0000-0000-000000000001');
insert into public.live_sessions (id, trainer_id, title, starts_at, audience) values
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f2', 'Live public', now() + interval '3 days', 'all');

insert into public.announcements (author_id, title, body, audience, course_id, status) values
  ('00000000-0000-0000-0000-0000000000a1', 'Bienvenue', 'Bienvenue à tous', 'all', null, 'published'),
  ('00000000-0000-0000-0000-0000000000f1', 'Cours 1', 'Info du cours', 'course', 'c0000000-0000-0000-0000-000000000001', 'published'),
  ('00000000-0000-0000-0000-0000000000f1', 'Brouillon', 'Pas encore', 'course', 'c0000000-0000-0000-0000-000000000001', 'draft');

insert into storage.objects (bucket_id, name) values
  ('course-files', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000001/fiche.pdf'),
  ('course-files', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000002/fiche.pdf');

-- ---------------------------------------------------------------- Normalisation
select tests.ok(app.normalize_answer('  Ré Majeur ! ') = 're majeur', 'normalisation : accents, majuscules, ponctuation');
select tests.ok(app.normalize_answer('Fa♯') = 'fa diese' and app.normalize_answer('fa#') = 'fa diese', 'normalisation : dièse');
select tests.ok(app.normalize_answer('sous-dominante') = 'sous dominante', 'normalisation : trait d''union');
select tests.ok(app.parse_number('1,5') = 1.5 and app.parse_number('3/2') = 1.5 and app.parse_number('1 1/2') = 1.5, 'lecture des nombres');
select tests.ok(app.parse_number('abc') is null and app.parse_number('1/0') is null, 'nombres illisibles');

-- ---------------------------------------------------------------- Anonyme
set role anon;
select tests.refused('select * from public.profiles', 'un visiteur non connecté ne lit aucun profil');
select tests.refused('select * from public.exercise_attempts', 'un visiteur non connecté ne lit aucun résultat');
select tests.ok((select count(*) = 2 from public.platform_settings), 'un visiteur ne lit que les réglages publics');
select tests.refused('select public.admin_list_users()', 'un visiteur n''accède pas à la liste des comptes');
reset role;

-- ---------------------------------------------------------------- Élève S1
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';

select tests.ok((select count(*) = 1 from public.profiles where id = auth.uid()), 'S1 lit son profil');
select tests.ok((select count(*) = 0 from public.profiles where id = '00000000-0000-0000-0000-0000000000e2'), 'S1 ne lit pas le profil de S2');
select tests.ok((select count(*) = 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000f1'), 'S1 voit le nom de son formateur');
select tests.ok(tests.affected($$update public.profiles set first_name = 'Aya B.' where id = auth.uid()$$) = 1, 'S1 modifie son prénom');
select tests.refused($$update public.profiles set role = 'admin' where id = auth.uid()$$, 'S1 ne peut pas se donner le rôle admin');
select tests.refused($$update public.profiles set level = 'avance' where id = auth.uid()$$, 'S1 ne peut pas changer son niveau directement');
select tests.ok(tests.affected($$update public.profiles set first_name = 'X' where id = '00000000-0000-0000-0000-0000000000e2'$$) = 0, 'S1 ne modifie pas le profil de S2');

select tests.ok((select count(*) = 3 from public.courses), 'S1 voit le catalogue publié (3 cours), pas les brouillons');
select tests.ok((select count(*) = 1 from public.lessons), 'S1 ne voit que la leçon publiée de son niveau dans son cours');
select tests.ok((select content = 'Contenu L1' from public.lessons where id = '10000000-0000-0000-0000-000000000001'), 'S1 lit le contenu de L1');
select tests.ok((select count(*) = 0 from public.lessons where id = '10000000-0000-0000-0000-000000000002'), 'module avancé fermé à un débutant');
select tests.ok((select count(*) = 0 from public.lessons where id = '10000000-0000-0000-0000-000000000004'), 'leçon d''un cours où S1 n''est pas inscrit fermée');
select tests.ok((select count(*) = 1 from public.lesson_resources), 'S1 voit seulement les ressources des leçons accessibles');
select tests.ok((select count(*) = 1 from storage.objects where bucket_id = 'course-files'), 'S1 ne peut télécharger que les fichiers des leçons accessibles');

select tests.ok((select count(*) = 1 from public.exercises), 'S1 voit l''exercice de son cours');
select tests.ok((select count(*) = 4 from public.exercise_questions), 'S1 voit les énoncés');
select tests.ok((select count(*) = 0 from public.exercise_question_keys), 'S1 ne voit JAMAIS les corrigés');

select tests.ok((select count(*) = 1 from public.exercise_attempts), 'S1 ne voit que ses propres résultats');
select tests.ok(tests.affected($$insert into public.exercise_attempts (user_id, source, lab_id, score, max_score) values (auth.uid(), 'lab', 'rythme', 3, 4)$$) = 1, 'S1 enregistre une séance de laboratoire');
select tests.refused($$insert into public.exercise_attempts (user_id, source, lab_id, score, max_score) values ('00000000-0000-0000-0000-0000000000e2', 'lab', 'rythme', 3, 4)$$, 'S1 ne peut pas enregistrer un résultat au nom de S2');
select tests.refused($$insert into public.exercise_attempts (user_id, source, exercise_id, score, max_score) values (auth.uid(), 'exercise', 'e0000000-0000-0000-0000-000000000001', 4, 4)$$, 'S1 ne peut pas s''attribuer une note d''exercice sans correction');

-- Correction dans la base
select tests.ok((select (r ->> 'score')::int = 4 and (r ->> 'max_score')::int = 4 from (select public.submit_exercise_attempt(
  'e0000000-0000-0000-0000-000000000001',
  '{"f0000000-0000-0000-0000-000000000001":{"choiceId":"c2"},"f0000000-0000-0000-0000-000000000002":{"text":"12/2"},"f0000000-0000-0000-0000-000000000003":{"text":" re MAJEUR "},"f0000000-0000-0000-0000-000000000004":{"mapping":["4","2"]}}',
  'b0000000-0000-0000-0000-000000000001') r) x), 'correction dans la base : 4/4 avec des écritures variées');
select tests.ok((select (r ->> 'score')::int = 1 from (select public.submit_exercise_attempt(
  'e0000000-0000-0000-0000-000000000001',
  '{"f0000000-0000-0000-0000-000000000001":{"choiceId":"c1"},"f0000000-0000-0000-0000-000000000002":{"text":"abc"},"f0000000-0000-0000-0000-000000000004":{"mapping":["4","2"]}}') r) x), 'correction : réponses fausses ou absentes comptées justes = 1');
select tests.ok((select count(*) = 1 from public.assignment_submissions where student_id = auth.uid()), 'le rendu du devoir est créé');
select tests.refused($$update public.assignment_submissions set score = 100 where student_id = auth.uid()$$, 'S1 ne peut pas se noter');
select tests.ok(tests.affected($$update public.assignment_submissions set content = 'Mon travail' where student_id = auth.uid()$$) = 1, 'S1 complète son rendu');

select tests.ok((select count(*) = 1 from public.assignments), 'S1 voit le devoir publié de son groupe, pas le brouillon');
select tests.ok((select count(*) = 2 from public.live_sessions), 'S1 voit le live de son groupe et le live public');
select tests.ok((select count(*) = 2 from public.announcements), 'S1 voit les annonces publiées qui le concernent');
select tests.ok((select count(*) = 1 from public.group_members), 'S1 voit son appartenance, pas la liste des membres');

select tests.ok(tests.affected($$insert into public.learning_progress (user_id, lesson_id) values (auth.uid(), '10000000-0000-0000-0000-000000000001')$$) = 1, 'S1 enregistre sa progression sur L1');
select tests.refused($$insert into public.learning_progress (user_id, lesson_id) values (auth.uid(), '10000000-0000-0000-0000-000000000002')$$, 'pas de progression sur une leçon inaccessible');

select tests.refused($$insert into public.enrollments (course_id, user_id) values ('c0000000-0000-0000-0000-000000000002', auth.uid())$$, 'S1 ne s''inscrit pas seul à un cours fermé');
select tests.ok(tests.affected($$insert into public.enrollments (course_id, user_id) values ('c0000000-0000-0000-0000-000000000004', auth.uid())$$) = 1, 'S1 s''inscrit à un cours ouvert');

select tests.refused($$select public.admin_overview()$$, 'S1 n''a pas accès aux statistiques générales');
select tests.refused($$select * from public.admin_list_users()$$, 'S1 n''accède pas aux e-mails des comptes');
select tests.refused($$select public.set_user_role(auth.uid(), 'admin')$$, 'S1 ne peut pas changer de rôle par la fonction');
select tests.refused($$insert into public.courses (owner_id, title, slug) values (auth.uid(), 'Mon cours', 'mon-cours')$$, 'un élève ne crée pas de cours');

-- Test de positionnement : le niveau change, le module avancé s'ouvre.
select public.record_placement('intermediaire', '{"lecture":{"correct":4,"total":4},"intervalles":{"correct":2,"total":3}}', 'p-1');
select tests.ok((select level = 'intermediaire' from public.profiles where id = auth.uid()), 'le test de positionnement fixe le niveau');
select tests.ok((select count(*) = 1 from public.lessons where id = '10000000-0000-0000-0000-000000000002'), 'le module intermédiaire s''ouvre');
select tests.refused($$select public.record_placement('avance', '{"x":{"correct":5,"total":3}}')$$, 'scores incohérents refusés');
reset role;

-- ---------------------------------------------------------------- Élève S2
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
select tests.ok((select count(*) = 0 from public.exercises), 'S2 (non inscrit) ne voit pas l''exercice');
select tests.refused($$select public.submit_exercise_attempt('e0000000-0000-0000-0000-000000000001', '{}')$$, 'S2 ne peut pas faire l''exercice');
select tests.ok((select count(*) = 0 from public.exercise_attempts where user_id <> auth.uid()), 'S2 ne voit pas les résultats des autres');
select tests.ok((select count(*) = 1 from public.live_sessions), 'S2 ne voit pas le live du groupe de S1');
select tests.ok((select count(*) = 0 from public.assignment_submissions), 'S2 ne voit pas les rendus de S1');
select tests.ok((select count(*) = 0 from storage.objects), 'S2 ne télécharge aucun fichier de cours');
reset role;

-- ---------------------------------------------------------------- Formateur T1
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select tests.ok((select count(*) = 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'), 'T1 voit son élève S1');
select tests.ok((select count(*) = 0 from public.profiles where id = '00000000-0000-0000-0000-0000000000e3'), 'T1 ne voit pas S3 (élève de T2)');
select tests.ok((select count(*) >= 1 from public.exercise_attempts where user_id = '00000000-0000-0000-0000-0000000000e1'), 'T1 voit les résultats de S1');
select tests.ok((select count(*) = 0 from public.exercise_attempts where user_id = '00000000-0000-0000-0000-0000000000e3'), 'T1 ne voit pas les résultats de S3');
select tests.ok((select count(*) = 4 from public.exercise_question_keys), 'T1 lit les corrigés de son exercice');
select tests.ok((select count(*) = 3 from public.lessons where module_id in ('d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002')), 'T1 voit ses 3 leçons (dont le brouillon)');
select tests.ok(tests.affected($$update public.courses set title = 'Piraté' where id = 'c0000000-0000-0000-0000-000000000002'$$) = 0, 'T1 ne modifie pas le cours de T2');
select tests.refused($$insert into public.courses (owner_id, title, slug) values ('00000000-0000-0000-0000-0000000000f2', 'Faux', 'faux')$$, 'T1 ne crée pas un cours au nom de T2');
select tests.ok(tests.affected($$insert into public.courses (owner_id, title, slug) values (auth.uid(), 'Nouveau cours', 'nouveau-cours')$$) = 1, 'T1 crée un cours');
select tests.ok(tests.affected($$update public.assignment_submissions set score = 85, feedback = 'Bien', status = 'reviewed' where student_id = '00000000-0000-0000-0000-0000000000e1'$$) = 1, 'T1 corrige le rendu de S1');
select tests.ok((select reviewed_by = auth.uid() and reviewed_at is not null from public.assignment_submissions limit 1), 'la correction est signée');
select tests.refused($$update public.assignment_submissions set content = 'Réécrit' where student_id = '00000000-0000-0000-0000-0000000000e1'$$, 'T1 ne modifie pas le travail de l''élève');
select tests.ok(public.add_student_to_group('a0000000-0000-0000-0000-000000000001', 'ELEVE2@test.local') = '00000000-0000-0000-0000-0000000000e2', 'T1 ajoute S2 à son groupe par e-mail');
select tests.refused($$select public.add_student_to_group('a0000000-0000-0000-0000-000000000001', 'formateur2@test.local')$$, 'on n''ajoute pas un formateur comme élève');
select tests.refused($$select public.add_student_to_group('a0000000-0000-0000-0000-000000000002', 'eleve2@test.local')$$, 'T1 n''ajoute personne au groupe de T2');
select tests.ok((select count(*) = 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000e2'), 'S2, devenu élève de T1, lui est visible');
select public.set_student_level('00000000-0000-0000-0000-0000000000e2', 'intermediaire');
select tests.refused($$select public.set_student_level('00000000-0000-0000-0000-0000000000e3', 'avance')$$, 'T1 ne fixe pas le niveau d''un élève de T2');
select tests.refused($$insert into public.announcements (author_id, title, body, audience, status) values (auth.uid(), 'Tous', 'Message', 'all', 'published')$$, 'un formateur ne publie pas d''annonce à toute la plateforme');
select tests.ok(tests.affected($$insert into public.announcements (author_id, title, body, audience, course_id, status) values (auth.uid(), 'Cours', 'Message', 'course', 'c0000000-0000-0000-0000-000000000001', 'published')$$) = 1, 'T1 publie une annonce pour son cours');
select tests.ok(tests.affected($$insert into public.pedagogical_comments (student_id, author_id, body) values ('00000000-0000-0000-0000-0000000000e1', auth.uid(), 'Bon travail sur la clé de fa')$$) = 1, 'T1 commente le travail de S1');
select tests.refused($$insert into public.pedagogical_comments (student_id, author_id, body) values ('00000000-0000-0000-0000-0000000000e3', auth.uid(), 'Intrusion')$$, 'T1 ne commente pas un élève de T2');
select tests.ok(tests.affected($$insert into public.module_unlocks (student_id, lab_key, unlocked_by) values ('00000000-0000-0000-0000-0000000000e1', 'intervalles', auth.uid())$$) = 1, 'T1 débloque le module avancé pour S1');
select tests.ok(tests.affected($$insert into storage.objects (bucket_id, name) values ('course-files', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000001/audio.mp3')$$) = 1, 'T1 dépose un fichier dans sa leçon');
select tests.refused($$insert into storage.objects (bucket_id, name) values ('course-files', 'c0000000-0000-0000-0000-000000000002/10000000-0000-0000-0000-000000000004/x.pdf')$$, 'T1 ne dépose rien dans le cours de T2');
select tests.refused($$insert into storage.objects (bucket_id, name) values ('course-files', 'c0000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000004/x.pdf')$$, 'chemin incohérent (leçon d''un autre cours) refusé');
select tests.refused($$select public.set_user_role('00000000-0000-0000-0000-0000000000e1', 'trainer')$$, 'un formateur n''attribue pas de rôle');
select tests.refused($$select public.admin_overview()$$, 'un formateur n''a pas les statistiques générales');
reset role;

-- ---------------------------------------------------------------- Formateur T2
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
select tests.ok((select count(*) = 0 from public.groups where trainer_id = '00000000-0000-0000-0000-0000000000f1'), 'T2 ne voit pas les groupes de T1');
select tests.ok((select count(*) = 0 from public.assignment_submissions), 'T2 ne voit pas les rendus des devoirs de T1');
select tests.ok((select count(*) >= 1 from public.exercise_attempts where user_id = '00000000-0000-0000-0000-0000000000e1'), 'T2 suit S1, inscrit à son cours ouvert');
select tests.ok((select count(*) = 0 from public.pedagogical_comments), 'T2 ne voit pas les commentaires écrits par T1, même sur un élève commun');
select tests.ok((select count(*) = 0 from public.exercise_question_keys), 'T2 ne lit pas les corrigés de T1');
reset role;

-- ---------------------------------------------------------------- Administrateur
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select tests.ok((select count(*) = 6 from public.profiles), 'l''admin voit tous les comptes');
select tests.ok((select (public.admin_overview() ->> 'students')::int = 3), 'statistiques générales');
select tests.ok((select count(*) = 6 and max(total) = 6 from public.admin_list_users()), 'l''admin liste les comptes avec leur e-mail');
select tests.ok((select count(*) = 1 from public.admin_list_users('eleve2')), 'recherche par e-mail');
select tests.ok((select count(*) = 2 from public.admin_list_users('', 'trainer')), 'filtre par rôle');
select public.set_user_role('00000000-0000-0000-0000-0000000000e3', 'trainer');
select tests.ok((select role = 'trainer' from public.profiles where id = '00000000-0000-0000-0000-0000000000e3'), 'l''admin attribue un rôle');
select tests.refused($$select public.set_user_role(auth.uid(), 'student')$$, 'impossible de retirer le dernier administrateur');
select tests.refused($$select public.set_user_active(auth.uid(), false)$$, 'l''admin ne désactive pas son propre compte');
select public.set_user_active('00000000-0000-0000-0000-0000000000e2', false);
select tests.ok(tests.affected($$update public.platform_settings set value = 'false' where key = 'signup.open'$$) = 1, 'l''admin change un paramètre');
select tests.ok(tests.affected($$update public.courses set status = 'draft' where id = 'c0000000-0000-0000-0000-000000000002'$$) = 1, 'l''admin dépublie un cours');
reset role;

-- Un compte désactivé perd ses droits de formateur.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
select tests.ok(not app.is_staff(), 'un compte désactivé n''a aucun droit étendu');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select tests.ok(tests.affected($$update public.platform_settings set value = 'true' where key = 'signup.open'$$) = 0, 'un formateur ne change pas les paramètres');
reset role;

-- ---------------------------------------------------------------- Code d'invitation
select tests.ok(public.signup_requires_invite() = false, 'pas de code d''invitation par défaut');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select tests.refused($$select public.set_invite_code('PIRATE1')$$, 'un formateur ne fixe pas le code d''invitation');
select tests.refused($$select public.get_invite_code()$$, 'un formateur ne lit pas le code d''invitation');
select tests.refused($$select code from app.signup_invitation$$, 'la table du code est inaccessible par l''API');
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select tests.ok(public.set_invite_code(' solfege 2026 ') = 'SOLFEGE2026', 'l''admin fixe le code (normalisé)');
select tests.ok(public.get_invite_code() = 'SOLFEGE2026', 'l''admin relit le code');
select tests.refused($$select public.set_invite_code('ab')$$, 'code trop court refusé');
select tests.refused($$select public.set_invite_code('solfège')$$, 'code avec accent refusé');
reset role;
set role anon;
select tests.ok(public.signup_requires_invite(), 'un visiteur sait qu''un code est demandé');
select tests.refused($$select public.get_invite_code()$$, 'un visiteur ne lit pas le code');
reset role;
select tests.refused($$insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b1', 'intrus@test.local', '{"first_name":"Intrus"}')$$,
  'inscription sans code refusée');
select tests.refused($$insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b1', 'intrus@test.local', '{"first_name":"Intrus","invite_code":"MAUVAIS"}')$$,
  'inscription avec un mauvais code refusée');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b2', 'invite@test.local', '{"first_name":"Ama","invite_code":"solfege2026"}');
select tests.ok((select role = 'student' and first_name = 'Ama' from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'inscription avec le bon code acceptée');
select tests.ok((select not (raw_user_meta_data ? 'invite_code') from auth.users where id = '00000000-0000-0000-0000-0000000000b2'), 'le code n''est pas conservé dans le compte');
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-0000000000b3', 'cree-par-admin@test.local', now());
select tests.ok((select count(*) = 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000b3'), 'un compte créé par l''admin (déjà confirmé) n''a pas besoin du code');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select tests.ok(public.set_invite_code('') is null, 'l''admin supprime le code');
reset role;
select tests.ok(public.signup_requires_invite() = false, 'sans code, l''inscription est libre');

select format('%s vérifications réussies.', count(*)) as resultat from tests.results;
