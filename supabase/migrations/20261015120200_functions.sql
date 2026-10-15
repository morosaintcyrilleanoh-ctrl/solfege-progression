-- =============================================================================
-- Solfège Progression — opérations sensibles validées dans la base
-- Chaque fonction vérifie elle-même les droits de l'appelant (auth.uid()).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Normalisation des réponses (identique à normalizeText côté TypeScript)
-- -----------------------------------------------------------------------------
create function app.normalize_answer(p text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(
    translate(
      lower(
        replace(replace(replace(replace(replace(coalesce(p, ''),
          '𝄪', ' double diese'), '𝄫', ' double bemol'), '♯', ' diese'), '#', ' diese'), '♭', ' bemol')
      ),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ',
      'aaaaaaceeeeiiiinooooouuuuyy'
    ),
    '[’''`.,;:!?«»"()]', ' ', 'g'), '-', ' ', 'g'), '\s+', ' ', 'g'))
$$;

-- « 1,5 », « 3/2 », « 1 1/2 » -> nombre ; null si illisible.
create function app.parse_number(p text) returns numeric
language plpgsql immutable set search_path = '' as $$
declare
  t text := regexp_replace(replace(btrim(coalesce(p, '')), ',', '.'), '\s+', ' ', 'g');
  m text[];
begin
  if t ~ '^-?\d+(\.\d+)?$' then
    return t::numeric;
  end if;
  m := regexp_match(t, '^(-?\d+)\s*/\s*(\d+)$');
  if m is not null then
    if m[2]::numeric = 0 then return null; end if;
    return m[1]::numeric / m[2]::numeric;
  end if;
  m := regexp_match(t, '^(\d+) (\d+)/(\d+)$');
  if m is not null then
    if m[3]::numeric = 0 then return null; end if;
    return m[1]::numeric + m[2]::numeric / m[3]::numeric;
  end if;
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Correction d'un exercice de formateur, dans la base
-- p_answers : {"<question_id>": {"choiceId": "..."} | {"text": "..."} | {"mapping": ["..."]}}
-- -----------------------------------------------------------------------------
create function public.submit_exercise_attempt(p_exercise_id uuid, p_answers jsonb, p_assignment_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_ex public.exercises%rowtype;
  v_q record;
  v_answer jsonb;
  v_ok boolean;
  v_score integer := 0;
  v_max integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_attempt uuid;
  v_previous integer;
  v_num numeric;
begin
  if v_user is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Réponses invalides.' using errcode = '22023';
  end if;
  if not app.can_take_exercise(p_exercise_id) then
    raise exception 'Exercice inaccessible.' using errcode = '42501';
  end if;
  select * into v_ex from public.exercises where id = p_exercise_id;
  if v_ex.max_attempts is not null then
    select count(*) into v_previous from public.exercise_attempts
      where user_id = v_user and exercise_id = p_exercise_id;
    if v_previous >= v_ex.max_attempts then
      raise exception 'Nombre maximal de tentatives atteint.' using errcode = '42501';
    end if;
  end if;
  if p_assignment_id is not null and not exists (
    select 1 from public.assignments a
    where a.id = p_assignment_id and a.exercise_id = p_exercise_id and a.status = 'published'
      and (a.student_id = v_user or (a.group_id is not null and app.in_group(a.group_id)))
  ) then
    raise exception 'Devoir inaccessible.' using errcode = '42501';
  end if;

  for v_q in
    select q.id, q.type, q.answer_kind, k.correct, k.explanation
    from public.exercise_questions q join public.exercise_question_keys k on k.question_id = q.id
    where q.exercise_id = p_exercise_id
    order by q.position, q.created_at
  loop
    v_max := v_max + 1;
    v_answer := p_answers -> v_q.id::text;
    v_ok := false;
    if v_answer is not null then
      if v_q.type = 'mcq' then
        v_ok := v_q.correct ? (v_answer ->> 'choiceId');
      elsif v_q.type = 'short' and v_q.answer_kind = 'number' then
        v_num := app.parse_number(v_answer ->> 'text');
        v_ok := v_num is not null and exists (
          select 1 from jsonb_array_elements_text(v_q.correct) c where app.parse_number(c) = v_num
        );
      elsif v_q.type = 'short' then
        v_ok := app.normalize_answer(v_answer ->> 'text') <> '' and exists (
          select 1 from jsonb_array_elements_text(v_q.correct) c
          where app.normalize_answer(c) = app.normalize_answer(v_answer ->> 'text')
        );
      elsif v_q.type = 'match' then
        v_ok := (v_answer -> 'mapping') = v_q.correct;
      end if;
    end if;
    if v_ok then v_score := v_score + 1; end if;
    v_details := v_details || jsonb_build_object(
      'question_id', v_q.id, 'correct', v_ok, 'expected', v_q.correct, 'explanation', v_q.explanation
    );
  end loop;

  if v_max = 0 then
    raise exception 'Cet exercice ne contient aucune question.' using errcode = '22023';
  end if;

  insert into public.exercise_attempts (user_id, source, exercise_id, assignment_id, mode, score, max_score, details, started_at, completed_at)
  values (v_user, 'exercise', p_exercise_id, p_assignment_id,
          case when v_ex.kind = 'assessment' then 'evaluation' else 'training' end,
          v_score, v_max, jsonb_build_object('answers', p_answers, 'results', v_details), now(), now())
  returning id into v_attempt;

  if p_assignment_id is not null then
    insert into public.assignment_submissions (assignment_id, student_id, attempt_id)
    values (p_assignment_id, v_user, v_attempt)
    on conflict (assignment_id, student_id) do update
      set attempt_id = excluded.attempt_id, status = 'submitted', submitted_at = now()
      where public.assignment_submissions.status <> 'reviewed';
  end if;

  return jsonb_build_object('attempt_id', v_attempt, 'score', v_score, 'max_score', v_max, 'results', v_details);
end;
$$;

-- -----------------------------------------------------------------------------
-- Administration des comptes
-- -----------------------------------------------------------------------------
create function public.set_user_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  if p_role <> 'admin' and exists (select 1 from public.profiles where id = p_user and role = 'admin')
     and (select count(*) from public.profiles where role = 'admin' and is_active) <= 1 then
    raise exception 'Impossible de retirer le dernier administrateur.' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then
    raise exception 'Compte introuvable.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.set_user_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  if p_user = auth.uid() and not p_active then
    raise exception 'Vous ne pouvez pas désactiver votre propre compte.' using errcode = '42501';
  end if;
  update public.profiles set is_active = p_active where id = p_user;
  if not found then
    raise exception 'Compte introuvable.' using errcode = 'P0002';
  end if;
end;
$$;

-- Le formateur (ou l'administrateur) fixe le niveau d'un de ses élèves.
create function public.set_student_level(p_student uuid, p_level public.learner_level) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (app.is_admin() or app.trains_student(p_student)) then
    raise exception 'Cet élève ne fait pas partie de vos élèves.' using errcode = '42501';
  end if;
  update public.profiles set level = p_level where id = p_student;
end;
$$;

-- Résultat du test de positionnement, enregistré par l'élève lui-même.
create function public.record_placement(p_level public.learner_level, p_scores jsonb, p_client_session text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_correct integer := 0;
  v_total integer := 0;
  v_area record;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_scores) <> 'object' then
    raise exception 'Scores invalides.' using errcode = '22023';
  end if;
  for v_area in select value from jsonb_each(p_scores) loop
    v_correct := v_correct + coalesce((v_area.value ->> 'correct')::integer, 0);
    v_total := v_total + coalesce((v_area.value ->> 'total')::integer, 0);
  end loop;
  if v_total <= 0 or v_total > 100 or v_correct < 0 or v_correct > v_total then
    raise exception 'Scores invalides.' using errcode = '22023';
  end if;
  perform set_config('app.placement', 'on', true);
  update public.profiles
    set level = p_level, placement = jsonb_build_object('level', p_level, 'scores', p_scores, 'taken_at', now())
    where id = auth.uid();
  perform set_config('app.placement', 'off', true);
  insert into public.exercise_attempts (user_id, source, lab_id, mode, score, max_score, details, client_session_id, completed_at)
  values (auth.uid(), 'placement', 'positionnement', 'evaluation', v_correct, v_total, p_scores, p_client_session, now())
  on conflict (user_id, client_session_id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- Gestion des élèves par e-mail (sans exposer l'annuaire des élèves)
-- -----------------------------------------------------------------------------
create function app.student_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = lower(btrim(p_email)) and p.role = 'student' and p.is_active
$$;
revoke execute on function app.student_by_email(text) from authenticated;

create function public.add_student_to_group(p_group uuid, p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_student uuid;
begin
  if not (app.trains_group(p_group) or app.is_admin()) then
    raise exception 'Ce groupe ne vous appartient pas.' using errcode = '42501';
  end if;
  v_student := app.student_by_email(p_email);
  if v_student is null then
    raise exception 'Aucun compte élève actif avec cette adresse.' using errcode = 'P0002';
  end if;
  insert into public.group_members (group_id, user_id) values (p_group, v_student) on conflict do nothing;
  return v_student;
end;
$$;

create function public.enroll_student(p_course uuid, p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_student uuid;
begin
  if not app.can_manage_course(p_course) then
    raise exception 'Ce cours ne vous appartient pas.' using errcode = '42501';
  end if;
  v_student := app.student_by_email(p_email);
  if v_student is null then
    raise exception 'Aucun compte élève actif avec cette adresse.' using errcode = 'P0002';
  end if;
  insert into public.enrollments (course_id, user_id, enrolled_by) values (p_course, v_student, auth.uid())
    on conflict (course_id, user_id) do update set status = 'active';
  return v_student;
end;
$$;

-- Inscription de tous les membres d'un groupe à un cours.
create function public.enroll_group(p_course uuid, p_group uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not app.can_manage_course(p_course) or not (app.trains_group(p_group) or app.is_admin()) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  insert into public.enrollments (course_id, user_id, enrolled_by)
    select p_course, m.user_id, auth.uid() from public.group_members m where m.group_id = p_group
    on conflict (course_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Statistiques générales (administrateur)
-- -----------------------------------------------------------------------------
create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'trainers', (select count(*) from public.profiles where role = 'trainer'),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'inactive', (select count(*) from public.profiles where not is_active),
    'courses_published', (select count(*) from public.courses where status = 'published'),
    'courses_draft', (select count(*) from public.courses where status = 'draft'),
    'enrollments', (select count(*) from public.enrollments where status = 'active'),
    'attempts_7d', (select count(*) from public.exercise_attempts where created_at > now() - interval '7 days'),
    'active_students_7d', (select count(distinct user_id) from public.exercise_attempts where created_at > now() - interval '7 days'),
    'submissions_pending', (select count(*) from public.assignment_submissions where status = 'submitted'),
    'lives_upcoming', (select count(*) from public.live_sessions where starts_at > now() and status = 'scheduled')
  );
end;
$$;

-- Liste des comptes avec leur e-mail (administrateurs uniquement), avec recherche et pagination.
create function public.admin_list_users(p_search text default '', p_role public.app_role default null, p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, email text, first_name text, last_name text, role public.app_role, level public.learner_level, is_active boolean, created_at timestamptz, total bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.first_name, p.last_name, p.role, p.level, p.is_active, p.created_at, count(*) over ()
    from public.profiles p join auth.users u on u.id = p.id
    where (p_role is null or p.role = p_role)
      and (coalesce(p_search, '') = '' or u.email ilike '%' || p_search || '%'
           or (p.first_name || ' ' || p.last_name) ilike '%' || p_search || '%')
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end;
$$;

revoke execute on all functions in schema public from anon;
grant execute on function public.admin_list_users(text, public.app_role, integer, integer) to authenticated;
grant execute on function public.submit_exercise_attempt(uuid, jsonb, uuid) to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;
grant execute on function public.set_student_level(uuid, public.learner_level) to authenticated;
grant execute on function public.record_placement(public.learner_level, jsonb, text) to authenticated;
grant execute on function public.add_student_to_group(uuid, text) to authenticated;
grant execute on function public.enroll_student(uuid, text) to authenticated;
grant execute on function public.enroll_group(uuid, uuid) to authenticated;
grant execute on function public.admin_overview() to authenticated;
