-- =============================================================================
-- Solfège Progression — schéma de la base de données
-- Tables, contraintes, index et déclencheurs. Les règles d'accès (RLS) sont
-- dans la migration suivante.
-- =============================================================================

create extension if not exists pgcrypto;

-- Schéma interne (non exposé par l'API) pour les fonctions d'aide.
create schema if not exists app;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'trainer', 'student');
create type public.learner_level as enum ('debutant', 'intermediaire', 'avance');
create type public.publication_status as enum ('draft', 'published');
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');

-- -----------------------------------------------------------------------------
-- Profils (un par compte Supabase Auth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  role public.app_role not null default 'student',
  level public.learner_level not null default 'debutant',
  instrument text check (char_length(instrument) <= 80),
  musical_background text check (char_length(musical_background) <= 1000),
  goals text check (char_length(goals) <= 1000),
  country text check (char_length(country) <= 80),
  weekly_goal integer not null default 100 check (weekly_goal between 10 and 2000),
  placement jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- Cours > modules > leçons > ressources
-- -----------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  description text not null default '' check (char_length(description) <= 4000),
  level public.learner_level not null default 'debutant',
  status public.publication_status not null default 'draft',
  -- Cours ouvert : un élève peut s'y inscrire lui-même.
  is_open boolean not null default false,
  position integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_owner_idx on public.courses (owner_id);
create index courses_status_idx on public.courses (status);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  position integer not null default 0,
  status public.publication_status not null default 'draft',
  -- Niveau minimal ; le formateur peut débloquer le module pour un élève (module_unlocks).
  required_level public.learner_level not null default 'debutant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index modules_course_idx on public.modules (course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  summary text not null default '' check (char_length(summary) <= 1000),
  content text not null default '' check (char_length(content) <= 100000),
  video_url text check (video_url ~ '^https://[^\s]+$' and char_length(video_url) <= 500),
  duration_minutes integer check (duration_minutes between 0 and 600),
  position integer not null default 0,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_module_idx on public.lessons (module_id, position);

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('pdf', 'audio', 'video', 'image', 'document', 'link')),
  -- Fichier privé (Storage) OU lien externe, jamais les deux.
  storage_path text check (char_length(storage_path) <= 500),
  external_url text check (external_url ~ '^https://[^\s]+$' and char_length(external_url) <= 500),
  size_bytes bigint check (size_bytes >= 0),
  downloadable boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  check ((storage_path is null) <> (external_url is null))
);
create index lesson_resources_lesson_idx on public.lesson_resources (lesson_id, position);

-- -----------------------------------------------------------------------------
-- Exercices créés par les formateurs
-- -----------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid references public.courses (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  kind text not null default 'practice' check (kind in ('practice', 'assessment')),
  max_attempts integer check (max_attempts between 1 and 100),
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exercises_owner_idx on public.exercises (owner_id);
create index exercises_course_idx on public.exercises (course_id);
create index exercises_lesson_idx on public.exercises (lesson_id);

-- Énoncés : lisibles par les élèves autorisés.
create table public.exercise_questions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position integer not null default 0,
  type text not null check (type in ('mcq', 'short', 'match')),
  skill text not null default 'general' check (char_length(skill) <= 80),
  prompt text not null check (char_length(prompt) between 1 and 2000),
  -- Notation affichée (même format que le moteur d'exercices : notes, rythme, armure).
  notation jsonb,
  -- QCM : [{id, label}] ; association : {"left": [...], "right": [...]}.
  choices jsonb,
  answer_kind text check (answer_kind in ('text', 'number')),
  created_at timestamptz not null default now(),
  check (type <> 'short' or answer_kind is not null),
  check (type = 'short' or choices is not null)
);
create index exercise_questions_exercise_idx on public.exercise_questions (exercise_id, position);

-- Corrigés : JAMAIS lisibles par les élèves. La correction se fait dans la base
-- (fonction submit_exercise_attempt), après l'envoi des réponses.
create table public.exercise_question_keys (
  question_id uuid primary key references public.exercise_questions (id) on delete cascade,
  -- QCM : ["id", …] ; réponse courte : ["réponse acceptée", …] ; association : ["droite pour gauche 1", …].
  correct jsonb not null check (jsonb_typeof(correct) = 'array' and jsonb_array_length(correct) > 0),
  explanation text not null default '' check (char_length(explanation) <= 2000)
);

-- -----------------------------------------------------------------------------
-- Inscriptions, groupes
-- -----------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'suspended')),
  enrolled_by uuid references public.profiles (id) on delete set null,
  enrolled_at timestamptz not null default now(),
  unique (course_id, user_id)
);
create index enrollments_user_idx on public.enrollments (user_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now()
);
create index groups_trainer_idx on public.groups (trainer_id);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

-- -----------------------------------------------------------------------------
-- Tentatives et progression
-- -----------------------------------------------------------------------------
create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- lab : laboratoire (corrigé dans le navigateur, valeur d'entraînement) ;
  -- exercise : exercice d'un formateur (corrigé dans la base) ; placement : test de positionnement.
  source text not null check (source in ('lab', 'exercise', 'placement')),
  exercise_id uuid references public.exercises (id) on delete set null,
  assignment_id uuid,
  lab_id text check (char_length(lab_id) <= 60),
  mode text not null default 'training' check (mode in ('training', 'evaluation')),
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  details jsonb,
  -- Identifiant de la séance côté appareil : évite les doublons lors de l'import.
  client_session_id text check (char_length(client_session_id) <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (score <= max_score),
  check (source <> 'exercise' or exercise_id is not null),
  unique (user_id, client_session_id)
);
create index exercise_attempts_user_idx on public.exercise_attempts (user_id, created_at desc);
create index exercise_attempts_exercise_idx on public.exercise_attempts (exercise_id);

create table public.learning_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  -- Où reprendre : section de la leçon, position dans la vidéo…
  last_position jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index learning_progress_recent_idx on public.learning_progress (user_id, updated_at desc);

-- Déblocage individuel d'un module (parcours personnalisé par le formateur).
create table public.module_unlocks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid references public.modules (id) on delete cascade,
  -- Laboratoire avancé (ex. « intervalles »)
  lab_key text check (lab_key in ('intervalles')),
  unlocked_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((module_id is null) <> (lab_key is null)),
  unique (student_id, module_id),
  unique (student_id, lab_key)
);

-- -----------------------------------------------------------------------------
-- Devoirs
-- -----------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  instructions text not null default '' check (char_length(instructions) <= 10000),
  group_id uuid references public.groups (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  exercise_id uuid references public.exercises (id) on delete set null,
  due_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or student_id is not null)
);
create index assignments_group_idx on public.assignments (group_id);
create index assignments_student_idx on public.assignments (student_id);
create index assignments_creator_idx on public.assignments (created_by);

alter table public.exercise_attempts
  add constraint exercise_attempts_assignment_fk foreign key (assignment_id) references public.assignments (id) on delete set null;

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '' check (char_length(content) <= 10000),
  attachment_path text check (char_length(attachment_path) <= 500),
  attempt_id uuid references public.exercise_attempts (id) on delete set null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'returned')),
  score numeric(5, 2) check (score between 0 and 100),
  feedback text check (char_length(feedback) <= 4000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index assignment_submissions_student_idx on public.assignment_submissions (student_id);

-- -----------------------------------------------------------------------------
-- Lives, annonces, commentaires, paramètres
-- -----------------------------------------------------------------------------
create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 600),
  -- Lien de visioconférence externe (Zoom, Google Meet, Jitsi…).
  meeting_url text check (meeting_url ~ '^https://[^\s]+$' and char_length(meeting_url) <= 500),
  replay_url text check (replay_url ~ '^https://[^\s]+$' and char_length(replay_url) <= 500),
  replay_path text check (char_length(replay_path) <= 500),
  audience text not null default 'all' check (audience in ('all', 'course', 'group')),
  course_id uuid references public.courses (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <> 'course' or course_id is not null),
  check (audience <> 'group' or group_id is not null)
);
create index live_sessions_starts_idx on public.live_sessions (starts_at);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 1 and 8000),
  audience text not null default 'all' check (audience in ('all', 'course', 'group')),
  course_id uuid references public.courses (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  status public.publication_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (audience <> 'course' or course_id is not null),
  check (audience <> 'group' or group_id is not null)
);
create index announcements_published_idx on public.announcements (status, published_at desc);

create table public.pedagogical_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  context text check (char_length(context) <= 160),
  created_at timestamptz not null default now()
);
create index pedagogical_comments_student_idx on public.pedagogical_comments (student_id, created_at desc);

create table public.platform_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.]*$' and char_length(key) <= 80),
  value jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('site.name', '"Solfège Progression"'),
  ('signup.open', 'true'),
  ('student.default_weekly_goal', '100');

-- -----------------------------------------------------------------------------
-- Déclencheurs
-- -----------------------------------------------------------------------------
create function app.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'courses', 'modules', 'lessons', 'exercises', 'assignments',
                           'assignment_submissions', 'live_sessions', 'learning_progress']
  loop
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function app.touch_updated_at()', t);
  end loop;
end;
$$;

-- Création automatique du profil à l'inscription. Le rôle est TOUJOURS « élève » :
-- les métadonnées envoyées par le navigateur ne peuvent pas choisir un rôle.
create function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, weekly_goal)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), 80),
    left(btrim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), 80),
    -- Objectif par défaut réglé par l'administrateur.
    coalesce((
      select least(greatest((s.value #>> '{}')::integer, 10), 2000)
      from public.platform_settings s
      where s.key = 'student.default_weekly_goal' and jsonb_typeof(s.value) = 'number'
    ), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_user();

-- Date de publication renseignée automatiquement.
create function app.set_published_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger set_published_at before insert or update on public.courses
  for each row execute function app.set_published_at();
create trigger set_published_at before insert or update on public.announcements
  for each row execute function app.set_published_at();
