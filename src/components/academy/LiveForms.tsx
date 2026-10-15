'use client';

import { useState } from 'react';
import { registerReplayFileAction, saveAnnouncementAction, saveLiveAction } from '@/app/espace/lives/actions';
import { STATUS_OPTIONS, SelectField } from '@/components/forms/Controls';
import { ActionForm, Field } from '@/components/forms/Form';
import { LocalDateTimeInput } from '@/components/ui/LocalTime';
import type { LiveSessionRow } from '@/lib/supabase/database.types';
import { FileUpload } from './FileUpload';

type Opt = { id: string; title?: string; name?: string };

function AudienceFields({ courses, groups, allowAll, values, errors }: { courses: Opt[]; groups: Opt[]; allowAll: boolean; values?: Record<string, string | null | undefined>; errors?: Record<string, string> }) {
  const [audience, setAudience] = useState(values?.audience ?? (allowAll ? 'all' : courses.length ? 'course' : 'group'));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="f-audience" className="mb-1 block text-sm font-semibold text-slate-700">
          Public
        </label>
        <select id="f-audience" name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-3">
          {allowAll && <option value="all">Tous les utilisateurs connectés</option>}
          <option value="course">Les inscrits d’un cours</option>
          <option value="group">Un groupe</option>
        </select>
      </div>
      {audience === 'course' && (
        <SelectField name="course_id" label="Cours" defaultValue={values?.course_id} error={errors?.course_id} options={[{ value: '', label: 'Choisir…' }, ...courses.map((c) => ({ value: c.id, label: c.title ?? '' }))]} />
      )}
      {audience === 'group' && (
        <SelectField name="group_id" label="Groupe" defaultValue={values?.group_id} error={errors?.group_id} options={[{ value: '', label: 'Choisir…' }, ...groups.map((g) => ({ value: g.id, label: g.name ?? '' }))]} />
      )}
    </div>
  );
}

export function LiveForm({ live, courses, groups }: { live?: LiveSessionRow; courses: Opt[]; groups: Opt[] }) {
  return (
    <ActionForm action={saveLiveAction.bind(null, live?.id ?? null)} submitLabel={live ? 'Enregistrer la séance' : 'Programmer la séance'}>
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title ?? live?.title} error={s?.fieldErrors?.title} />
          <Field name="description" label="Présentation de la séance" as="textarea" rows={4} maxLength={4000} defaultValue={s?.values?.description ?? live?.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LocalDateTimeInput name="starts_at" label="Date et heure" required defaultIso={s?.values?.starts_at || live?.starts_at} error={s?.fieldErrors?.starts_at} />
            <Field name="duration_minutes" label="Durée (minutes)" type="number" min={5} max={600} defaultValue={s?.values?.duration_minutes ?? live?.duration_minutes ?? 60} error={s?.fieldErrors?.duration_minutes} />
            <Field name="meeting_url" label="Lien de visioconférence (Zoom, Meet, Jitsi…)" type="url" defaultValue={s?.values?.meeting_url ?? live?.meeting_url} error={s?.fieldErrors?.meeting_url} />
            <Field name="replay_url" label="Lien du replay (facultatif)" type="url" defaultValue={s?.values?.replay_url ?? live?.replay_url} error={s?.fieldErrors?.replay_url} />
          </div>
          <AudienceFields
            courses={courses}
            groups={groups}
            allowAll
            values={{ audience: s?.values?.audience ?? live?.audience, course_id: s?.values?.course_id ?? live?.course_id, group_id: s?.values?.group_id ?? live?.group_id }}
            errors={s?.fieldErrors}
          />
          <SelectField
            name="status"
            label="État"
            defaultValue={s?.values?.status ?? live?.status ?? 'scheduled'}
            options={[
              { value: 'scheduled', label: 'Programmée' },
              { value: 'completed', label: 'Terminée' },
              { value: 'cancelled', label: 'Annulée' },
            ]}
          />
        </>
      )}
    </ActionForm>
  );
}

export function ReplayUpload({ liveId }: { liveId: string }) {
  return <FileUpload bucket="replays" folder={liveId} label="Fichier du replay (vidéo ou audio)" onUploaded={(f) => registerReplayFileAction(liveId, f.path)} />;
}

export function AnnouncementForm({ courses, groups, isAdmin }: { courses: Opt[]; groups: Opt[]; isAdmin: boolean }) {
  return (
    <ActionForm action={saveAnnouncementAction} submitLabel="Enregistrer l’annonce">
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.ok ? '' : s?.values?.title} error={s?.fieldErrors?.title} />
          <Field name="body" label="Message" as="textarea" rows={5} maxLength={8000} defaultValue={s?.ok ? '' : s?.values?.body} error={s?.fieldErrors?.body} />
          <AudienceFields courses={courses} groups={groups} allowAll={isAdmin} values={s?.values} errors={s?.fieldErrors} />
          <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? 'published'} />
        </>
      )}
    </ActionForm>
  );
}
