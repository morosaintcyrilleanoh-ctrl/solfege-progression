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

-- Tailles maximales et types de fichiers acceptés (contrôlés aussi par Supabase lors de l'envoi).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('course-files', 'course-files', false, 26214400,
   array['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'image/jpeg', 'image/png', 'image/webp',
         'video/mp4', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('submissions', 'submissions', false, 10485760,
   array['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']),
  ('replays', 'replays', false, 524288000, array['video/mp4', 'audio/mpeg', 'audio/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

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
