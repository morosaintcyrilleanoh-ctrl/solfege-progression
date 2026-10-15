-- =============================================================================
-- Solfège Progression — fichiers privés (Supabase Storage)
-- Tous les compartiments sont privés : les téléchargements passent par des
-- liens signés à durée limitée, générés après vérification des droits.
--
-- Organisation des chemins :
--   course-files/{course_id}/{lesson_id}/{fichier}   ressources des leçons
--   submissions/{assignment_id}/{student_id}/{fichier} rendus de devoirs
--   replays/{live_session_id}/{fichier}               replays des lives
-- =============================================================================

insert into storage.buckets (id, name, public) values
  ('course-files', 'course-files', false),
  ('submissions', 'submissions', false),
  ('replays', 'replays', false)
on conflict (id) do update set public = false;

-- Ressources de leçons ----------------------------------------------------------
create policy course_files_read on storage.objects for select to authenticated using (
  bucket_id = 'course-files'
  and app.course_of_lesson(app.try_uuid((storage.foldername(name))[2])) = app.try_uuid((storage.foldername(name))[1])
  and app.can_access_lesson(app.try_uuid((storage.foldername(name))[2]))
);
create policy course_files_write on storage.objects for insert to authenticated with check (
  bucket_id = 'course-files'
  and app.can_manage_course(app.try_uuid((storage.foldername(name))[1]))
  and app.course_of_lesson(app.try_uuid((storage.foldername(name))[2])) = app.try_uuid((storage.foldername(name))[1])
);
create policy course_files_update on storage.objects for update to authenticated using (
  bucket_id = 'course-files' and app.can_manage_course(app.try_uuid((storage.foldername(name))[1]))
);
create policy course_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'course-files' and app.can_manage_course(app.try_uuid((storage.foldername(name))[1]))
);

-- Rendus de devoirs ---------------------------------------------------------------
create policy submissions_files_read on storage.objects for select to authenticated using (
  bucket_id = 'submissions' and (
    app.try_uuid((storage.foldername(name))[2]) = auth.uid()
    or app.is_assignment_author(app.try_uuid((storage.foldername(name))[1]))
  )
);
create policy submissions_files_write on storage.objects for insert to authenticated with check (
  bucket_id = 'submissions'
  and app.try_uuid((storage.foldername(name))[2]) = auth.uid()
  and exists (select 1 from public.assignments a where a.id = app.try_uuid((storage.foldername(name))[1]))
);
create policy submissions_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'submissions' and app.try_uuid((storage.foldername(name))[2]) = auth.uid()
);

-- Replays ---------------------------------------------------------------------------
create policy replays_read on storage.objects for select to authenticated using (
  bucket_id = 'replays'
  and exists (select 1 from public.live_sessions s where s.id = app.try_uuid((storage.foldername(name))[1]))
);
create policy replays_write on storage.objects for insert to authenticated with check (
  bucket_id = 'replays'
  and exists (
    select 1 from public.live_sessions s
    where s.id = app.try_uuid((storage.foldername(name))[1]) and (s.trainer_id = auth.uid() or app.is_admin())
  )
);
create policy replays_delete on storage.objects for delete to authenticated using (
  bucket_id = 'replays'
  and exists (
    select 1 from public.live_sessions s
    where s.id = app.try_uuid((storage.foldername(name))[1]) and (s.trainer_id = auth.uid() or app.is_admin())
  )
);
