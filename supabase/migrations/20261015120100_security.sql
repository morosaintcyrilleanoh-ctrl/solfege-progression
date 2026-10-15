-- =============================================================================
-- Solfège Progression — règles d'accès (Row Level Security)
--
-- Principe : chaque table est fermée par défaut (RLS activé, aucune politique =
-- aucun accès), puis on ouvre précisément ce que chaque rôle peut voir ou faire.
--   • élève      : ses propres données ; les contenus publiés des cours où il est inscrit
--   • formateur  : ses cours, ses groupes, et les élèves de ses groupes ou de ses cours
--   • admin      : tout
-- Les fonctions d'aide sont SECURITY DEFINER dans le schéma « app » (non exposé
-- par l'API) pour éviter la récursion des politiques.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fonctions d'aide
-- -----------------------------------------------------------------------------
create function app.current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

create function app.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app.current_role() = 'admin', false)
$$;

create function app.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app.current_role() in ('admin', 'trainer'), false)
$$;

create function app.current_level() returns public.learner_level
language sql stable security definer set search_path = '' as $$
  select p.level from public.profiles p where p.id = auth.uid()
$$;

create function app.level_rank(l public.learner_level) returns integer
language sql immutable set search_path = '' as $$
  select case l when 'debutant' then 0 when 'intermediaire' then 1 when 'avance' then 2 end
$$;

create function app.owns_course(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c where c.id = p_course and c.owner_id = auth.uid())
$$;

create function app.can_manage_course(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_admin() or (app.is_staff() and app.owns_course(p_course))
$$;

create function app.is_enrolled(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course and e.user_id = auth.uid() and e.status in ('active', 'completed')
  )
$$;

create function app.in_group(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = auth.uid())
$$;

create function app.trains_group(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_staff() and exists (select 1 from public.groups g where g.id = p_group and g.trainer_id = auth.uid())
$$;

-- Le formateur connecté suit-il cet élève (groupe ou cours dont il est responsable) ?
create function app.trains_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_staff() and (
    exists (
      select 1 from public.group_members m join public.groups g on g.id = m.group_id
      where m.user_id = p_student and g.trainer_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e join public.courses c on c.id = e.course_id
      where e.user_id = p_student and c.owner_id = auth.uid()
    )
  )
$$;

create function app.course_of_lesson(p_lesson uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.course_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = p_lesson
$$;

-- Accès élève à une leçon : tout est publié, l'élève est inscrit, et son niveau
-- atteint celui du module (ou le formateur a débloqué le module pour lui).
create function app.can_access_lesson(p_lesson uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    app.is_admin()
    or app.owns_course(app.course_of_lesson(p_lesson))
    or exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = p_lesson
        and l.status = 'published' and m.status = 'published' and c.status = 'published'
        and app.is_enrolled(c.id)
        and (
          app.level_rank(app.current_level()) >= app.level_rank(m.required_level)
          or exists (select 1 from public.module_unlocks u where u.module_id = m.id and u.student_id = auth.uid())
        )
    )
$$;

create function app.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

-- Un élève peut-il faire cet exercice ?
create function app.can_take_exercise(p_exercise uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.exercises e
    where e.id = p_exercise and (
      app.is_admin()
      or e.owner_id = auth.uid()
      or (
        e.status = 'published' and (
          (e.lesson_id is not null and app.can_access_lesson(e.lesson_id))
          or (e.lesson_id is null and e.course_id is not null and app.is_enrolled(e.course_id))
          or (e.lesson_id is null and e.course_id is null)
          or exists (
            select 1 from public.assignments a
            where a.exercise_id = e.id and a.status = 'published'
              and (a.student_id = auth.uid() or (a.group_id is not null and app.in_group(a.group_id)))
          )
        )
      )
    )
  )
$$;

create function app.can_see_audience(p_audience text, p_course uuid, p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_audience
    when 'all' then true
    when 'course' then app.is_enrolled(p_course) or app.owns_course(p_course)
    when 'group' then app.in_group(p_group) or app.trains_group(p_group)
    else false
  end
$$;

grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;

-- -----------------------------------------------------------------------------
-- Activation du RLS et retrait des droits anonymes (défense en profondeur)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'courses', 'modules', 'lessons', 'lesson_resources', 'exercises',
    'exercise_questions', 'exercise_question_keys', 'enrollments', 'groups', 'group_members',
    'exercise_attempts', 'learning_progress', 'module_unlocks', 'assignments', 'assignment_submissions',
    'live_sessions', 'announcements', 'pedagogical_comments', 'platform_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or app.is_admin() or app.trains_student(id)
  -- Les noms des formateurs sont visibles (auteur d'un cours, d'un live…).
  or role in ('trainer', 'admin')
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- Le rôle, l'activation et le niveau ne se modifient pas librement.
create function app.protect_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return new; -- opération de maintenance (service), hors API
  end if;
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active) and not app.is_admin() then
    raise exception 'Seul un administrateur peut changer un rôle ou désactiver un compte.' using errcode = '42501';
  end if;
  if new.level is distinct from old.level
     and not app.is_admin()
     and not app.trains_student(new.id)
     and coalesce(current_setting('app.placement', true), '') <> 'on' then
    raise exception 'Le niveau est fixé par le test de positionnement ou par le formateur.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger protect_profile before update on public.profiles
  for each row execute function app.protect_profile();

-- -----------------------------------------------------------------------------
-- Cours, modules, leçons, ressources
-- -----------------------------------------------------------------------------
create policy courses_select on public.courses for select to authenticated using (
  status = 'published' or owner_id = auth.uid() or app.is_admin()
);
create policy courses_insert on public.courses for insert to authenticated with check (
  app.is_staff() and owner_id = auth.uid()
);
create policy courses_update on public.courses for update to authenticated
  using (app.can_manage_course(id))
  with check (app.is_admin() or (app.is_staff() and owner_id = auth.uid()));
create policy courses_delete on public.courses for delete to authenticated using (app.can_manage_course(id));

-- Le plan d'un cours publié (titres des modules) est visible de tous ; le contenu ne l'est pas.
create policy modules_select on public.modules for select to authenticated using (
  app.can_manage_course(course_id)
  or (status = 'published' and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'))
);
create policy modules_write on public.modules for all to authenticated
  using (app.can_manage_course(course_id)) with check (app.can_manage_course(course_id));

create policy lessons_select on public.lessons for select to authenticated using (app.can_access_lesson(id));
create policy lessons_write on public.lessons for all to authenticated
  using (app.can_manage_course(app.course_of_lesson(id)))
  with check (app.can_manage_course((select m.course_id from public.modules m where m.id = module_id)));

create policy lesson_resources_select on public.lesson_resources for select to authenticated using (app.can_access_lesson(lesson_id));
create policy lesson_resources_write on public.lesson_resources for all to authenticated
  using (app.can_manage_course(app.course_of_lesson(lesson_id)))
  with check (app.can_manage_course(app.course_of_lesson(lesson_id)));

-- -----------------------------------------------------------------------------
-- Exercices
-- -----------------------------------------------------------------------------
create policy exercises_select on public.exercises for select to authenticated using (app.can_take_exercise(id));
create policy exercises_insert on public.exercises for insert to authenticated with check (
  app.is_staff() and owner_id = auth.uid()
  and (course_id is null or app.can_manage_course(course_id))
  and (lesson_id is null or app.can_manage_course(app.course_of_lesson(lesson_id)))
);
create policy exercises_update on public.exercises for update to authenticated
  using (owner_id = auth.uid() or app.is_admin())
  with check (
    (app.is_admin() or (app.is_staff() and owner_id = auth.uid()))
    and (course_id is null or app.can_manage_course(course_id))
  );
create policy exercises_delete on public.exercises for delete to authenticated using (owner_id = auth.uid() or app.is_admin());

create policy exercise_questions_select on public.exercise_questions for select to authenticated using (
  app.can_take_exercise(exercise_id)
);
create policy exercise_questions_write on public.exercise_questions for all to authenticated
  using (exists (select 1 from public.exercises e where e.id = exercise_id and (e.owner_id = auth.uid() or app.is_admin())))
  with check (exists (select 1 from public.exercises e where e.id = exercise_id and (e.owner_id = auth.uid() or app.is_admin())));

-- Corrigés : propriétaire de l'exercice et administrateurs uniquement.
create policy exercise_question_keys_all on public.exercise_question_keys for all to authenticated
  using (exists (
    select 1 from public.exercise_questions q join public.exercises e on e.id = q.exercise_id
    where q.id = question_id and (e.owner_id = auth.uid() or app.is_admin())
  ))
  with check (exists (
    select 1 from public.exercise_questions q join public.exercises e on e.id = q.exercise_id
    where q.id = question_id and (e.owner_id = auth.uid() or app.is_admin())
  ));

-- -----------------------------------------------------------------------------
-- Inscriptions, groupes
-- -----------------------------------------------------------------------------
create policy enrollments_select on public.enrollments for select to authenticated using (
  user_id = auth.uid() or app.can_manage_course(course_id) or app.trains_student(user_id)
);
create policy enrollments_insert on public.enrollments for insert to authenticated with check (
  app.can_manage_course(course_id)
  -- Inscription libre à un cours publié et ouvert.
  or (
    user_id = auth.uid() and status = 'active'
    and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published' and c.is_open)
  )
);
create policy enrollments_update on public.enrollments for update to authenticated
  using (app.can_manage_course(course_id)) with check (app.can_manage_course(course_id));
create policy enrollments_delete on public.enrollments for delete to authenticated using (app.can_manage_course(course_id));

create policy groups_select on public.groups for select to authenticated using (
  trainer_id = auth.uid() or app.is_admin() or app.in_group(id)
);
create policy groups_insert on public.groups for insert to authenticated with check (app.is_staff() and trainer_id = auth.uid());
create policy groups_update on public.groups for update to authenticated
  using (app.trains_group(id) or app.is_admin())
  with check (app.is_admin() or (app.is_staff() and trainer_id = auth.uid()));
create policy groups_delete on public.groups for delete to authenticated using (app.trains_group(id) or app.is_admin());

-- Un élève voit seulement sa propre appartenance (pas la liste de ses camarades).
create policy group_members_select on public.group_members for select to authenticated using (
  user_id = auth.uid() or app.trains_group(group_id) or app.is_admin()
);
create policy group_members_insert on public.group_members for insert to authenticated with check (
  (app.trains_group(group_id) or app.is_admin())
  and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'student')
);
create policy group_members_delete on public.group_members for delete to authenticated using (
  app.trains_group(group_id) or app.is_admin()
);

-- -----------------------------------------------------------------------------
-- Tentatives, progression, déblocages
-- -----------------------------------------------------------------------------
create policy exercise_attempts_select on public.exercise_attempts for select to authenticated using (
  user_id = auth.uid() or app.trains_student(user_id) or app.is_admin()
);
-- L'élève enregistre lui-même ses séances de laboratoire et son test de positionnement.
-- Les tentatives d'exercices de formateur passent par submit_exercise_attempt (corrigées dans la base).
create policy exercise_attempts_insert on public.exercise_attempts for insert to authenticated with check (
  user_id = auth.uid() and source in ('lab', 'placement') and exercise_id is null and assignment_id is null
);
create policy exercise_attempts_delete on public.exercise_attempts for delete to authenticated using (app.is_admin());

create policy learning_progress_select on public.learning_progress for select to authenticated using (
  user_id = auth.uid() or app.trains_student(user_id) or app.is_admin()
);
create policy learning_progress_insert on public.learning_progress for insert to authenticated with check (
  user_id = auth.uid() and app.can_access_lesson(lesson_id)
);
create policy learning_progress_update on public.learning_progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and app.can_access_lesson(lesson_id));

create policy module_unlocks_select on public.module_unlocks for select to authenticated using (
  student_id = auth.uid() or app.trains_student(student_id) or app.is_admin()
);
create policy module_unlocks_insert on public.module_unlocks for insert to authenticated with check (
  (app.is_admin() or app.trains_student(student_id))
  and unlocked_by = auth.uid()
  and (module_id is null or app.can_manage_course((select m.course_id from public.modules m where m.id = module_id)))
);
create policy module_unlocks_delete on public.module_unlocks for delete to authenticated using (
  app.is_admin() or app.trains_student(student_id)
);

-- -----------------------------------------------------------------------------
-- Devoirs
-- -----------------------------------------------------------------------------
create policy assignments_select on public.assignments for select to authenticated using (
  created_by = auth.uid() or app.is_admin()
  or (status = 'published' and (student_id = auth.uid() or (group_id is not null and app.in_group(group_id))))
);
create policy assignments_insert on public.assignments for insert to authenticated with check (
  app.is_staff() and created_by = auth.uid()
  and (group_id is null or app.trains_group(group_id) or app.is_admin())
  and (student_id is null or app.trains_student(student_id) or app.is_admin())
);
create policy assignments_update on public.assignments for update to authenticated
  using (created_by = auth.uid() or app.is_admin())
  with check (
    (created_by = auth.uid() or app.is_admin())
    and (group_id is null or app.trains_group(group_id) or app.is_admin())
    and (student_id is null or app.trains_student(student_id) or app.is_admin())
  );
create policy assignments_delete on public.assignments for delete to authenticated using (created_by = auth.uid() or app.is_admin());

create function app.is_assignment_author(p_assignment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_admin() or exists (select 1 from public.assignments a where a.id = p_assignment and a.created_by = auth.uid())
$$;
grant execute on function app.is_assignment_author(uuid) to authenticated;

create policy submissions_select on public.assignment_submissions for select to authenticated using (
  student_id = auth.uid() or app.is_assignment_author(assignment_id)
);
create policy submissions_insert on public.assignment_submissions for insert to authenticated with check (
  student_id = auth.uid() and status = 'submitted' and score is null and feedback is null and reviewed_by is null
  and exists (select 1 from public.assignments a where a.id = assignment_id) -- RLS : devoir visible par l'élève
);
create policy submissions_update on public.assignment_submissions for update to authenticated
  using (student_id = auth.uid() or app.is_assignment_author(assignment_id))
  with check (student_id = auth.uid() or app.is_assignment_author(assignment_id));

-- L'élève modifie seulement son travail ; le formateur seulement la correction.
create function app.protect_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if app.is_assignment_author(new.assignment_id) and new.student_id <> auth.uid() then
    if new.content is distinct from old.content or new.attachment_path is distinct from old.attachment_path
       or new.attempt_id is distinct from old.attempt_id or new.student_id <> old.student_id
       or new.assignment_id <> old.assignment_id then
      raise exception 'Le formateur ne modifie pas le travail de l''élève.' using errcode = '42501';
    end if;
    if new.status <> old.status or new.score is distinct from old.score or new.feedback is distinct from old.feedback then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  -- Élève
  if new.score is distinct from old.score or new.feedback is distinct from old.feedback
     or new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at
     or new.student_id <> old.student_id or new.assignment_id <> old.assignment_id then
    raise exception 'Un élève ne peut pas modifier la correction.' using errcode = '42501';
  end if;
  if old.status = 'reviewed' then
    raise exception 'Ce devoir a déjà été corrigé.' using errcode = '42501';
  end if;
  new.status := 'submitted';
  new.submitted_at := now();
  return new;
end;
$$;
create trigger protect_submission before update on public.assignment_submissions
  for each row execute function app.protect_submission();

-- -----------------------------------------------------------------------------
-- Lives, annonces, commentaires, paramètres
-- -----------------------------------------------------------------------------
create policy live_sessions_select on public.live_sessions for select to authenticated using (
  trainer_id = auth.uid() or app.is_admin() or app.can_see_audience(audience, course_id, group_id)
);
create policy live_sessions_insert on public.live_sessions for insert to authenticated with check (
  app.is_staff() and trainer_id = auth.uid()
  and (audience = 'all' or (audience = 'course' and app.can_manage_course(course_id)) or (audience = 'group' and (app.trains_group(group_id) or app.is_admin())))
);
create policy live_sessions_update on public.live_sessions for update to authenticated
  using (trainer_id = auth.uid() or app.is_admin())
  with check (
    (trainer_id = auth.uid() or app.is_admin())
    and (audience = 'all' or (audience = 'course' and app.can_manage_course(course_id)) or (audience = 'group' and (app.trains_group(group_id) or app.is_admin())))
  );
create policy live_sessions_delete on public.live_sessions for delete to authenticated using (trainer_id = auth.uid() or app.is_admin());

create policy announcements_select on public.announcements for select to authenticated using (
  author_id = auth.uid() or app.is_admin()
  or (status = 'published' and app.can_see_audience(audience, course_id, group_id))
);
-- Annonce à toute la plateforme : administrateurs ; formateurs : leurs cours et groupes.
create policy announcements_insert on public.announcements for insert to authenticated with check (
  author_id = auth.uid() and (
    app.is_admin()
    or (app.is_staff() and audience = 'course' and app.owns_course(course_id))
    or (app.is_staff() and audience = 'group' and app.trains_group(group_id))
  )
);
create policy announcements_update on public.announcements for update to authenticated
  using (author_id = auth.uid() or app.is_admin())
  with check (
    app.is_admin()
    or (author_id = auth.uid() and app.is_staff() and (
      (audience = 'course' and app.owns_course(course_id)) or (audience = 'group' and app.trains_group(group_id))
    ))
  );
create policy announcements_delete on public.announcements for delete to authenticated using (author_id = auth.uid() or app.is_admin());

-- Un commentaire est visible de son auteur, de l'élève concerné et des administrateurs
-- (pas des autres formateurs de l'élève).
create policy comments_select on public.pedagogical_comments for select to authenticated using (
  student_id = auth.uid() or author_id = auth.uid() or app.is_admin()
);
create policy comments_insert on public.pedagogical_comments for insert to authenticated with check (
  author_id = auth.uid() and (app.is_admin() or app.trains_student(student_id))
);
create policy comments_update on public.pedagogical_comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on public.pedagogical_comments for delete to authenticated using (author_id = auth.uid() or app.is_admin());

create policy settings_select on public.platform_settings for select to authenticated using (true);
create policy settings_write on public.platform_settings for all to authenticated
  using (app.is_admin()) with check (app.is_admin());
