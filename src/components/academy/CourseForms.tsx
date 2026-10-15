'use client';

import {
  addLinkResourceAction,
  createCourseAction,
  createLessonAction,
  createModuleAction,
  enrollByEmailAction,
  enrollGroupAction,
  updateCourseAction,
  updateLessonAction,
  updateModuleAction,
} from '@/app/espace/formateur/actions';
import { CheckboxField, LEVEL_OPTIONS, STATUS_OPTIONS, SelectField } from '@/components/forms/Controls';
import { ActionForm, Field } from '@/components/forms/Form';
import type { CourseRow, LessonRow, ModuleRow } from '@/lib/supabase/database.types';

export function CourseForm({ course }: { course?: CourseRow }) {
  const action = course ? updateCourseAction.bind(null, course.id) : createCourseAction;
  return (
    <ActionForm action={action} submitLabel={course ? 'Enregistrer le cours' : 'Créer le cours'}>
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title ?? course?.title} error={s?.fieldErrors?.title} />
          <Field name="description" label="Présentation" as="textarea" maxLength={4000} defaultValue={s?.values?.description ?? course?.description} error={s?.fieldErrors?.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="level" label="Niveau" options={LEVEL_OPTIONS} defaultValue={s?.values?.level ?? course?.level ?? 'debutant'} />
            <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? course?.status ?? 'draft'} />
          </div>
          <CheckboxField name="is_open" label="Cours ouvert" hint="Les élèves peuvent s’y inscrire eux-mêmes depuis le catalogue." defaultChecked={course?.is_open} />
        </>
      )}
    </ActionForm>
  );
}

export function ModuleForm({ courseId, module }: { courseId: string; module?: ModuleRow }) {
  const action = module ? updateModuleAction.bind(null, module.id) : createModuleAction.bind(null, courseId);
  return (
    <ActionForm action={action} submitLabel={module ? 'Enregistrer le module' : 'Ajouter le module'}>
      {(s) => (
        <>
          <Field name="title" label="Titre du module" required maxLength={160} defaultValue={s?.values?.title ?? module?.title} error={s?.fieldErrors?.title} />
          <Field name="description" label="Description" as="textarea" rows={2} maxLength={2000} defaultValue={s?.values?.description ?? module?.description} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              name="required_level"
              label="Niveau requis"
              options={LEVEL_OPTIONS}
              defaultValue={s?.values?.required_level ?? module?.required_level ?? 'debutant'}
              hint="Contenu fermé aux élèves de niveau inférieur (sauf déblocage)."
            />
            <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? module?.status ?? 'draft'} />
            <Field name="position" label="Ordre" type="number" min={0} max={999} defaultValue={s?.values?.position ?? module?.position ?? 0} />
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function NewLessonForm({ moduleId }: { moduleId: string }) {
  return (
    <ActionForm action={createLessonAction.bind(null, moduleId)} submitLabel="Créer la leçon">
      {(s) => <Field name="title" label="Titre de la nouvelle leçon" required maxLength={160} defaultValue={s?.values?.title} error={s?.fieldErrors?.title} />}
    </ActionForm>
  );
}

export function LessonForm({ lesson }: { lesson: LessonRow }) {
  return (
    <ActionForm action={updateLessonAction.bind(null, lesson.id)} submitLabel="Enregistrer la leçon">
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title ?? lesson.title} error={s?.fieldErrors?.title} />
          <Field name="summary" label="Résumé" as="textarea" rows={2} maxLength={1000} defaultValue={s?.values?.summary ?? lesson.summary} />
          <Field
            name="content"
            label="Contenu écrit"
            as="textarea"
            rows={14}
            maxLength={100000}
            defaultValue={s?.values?.content ?? lesson.content}
            hint="Mise en forme simple : # Titre, ## Sous-titre, - liste, **gras**, *italique*, [lien](https://…)."
            error={s?.fieldErrors?.content}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="video_url" label="Vidéo (YouTube, Vimeo ou lien https)" type="url" defaultValue={s?.values?.video_url ?? lesson.video_url} error={s?.fieldErrors?.video_url} />
            <Field name="duration_minutes" label="Durée estimée (minutes)" type="number" min={0} max={600} defaultValue={s?.values?.duration_minutes ?? lesson.duration_minutes} error={s?.fieldErrors?.duration_minutes} />
            <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? lesson.status} />
            <Field name="position" label="Ordre dans le module" type="number" min={0} max={999} defaultValue={s?.values?.position ?? lesson.position} />
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function LinkResourceForm({ lessonId }: { lessonId: string }) {
  return (
    <ActionForm action={addLinkResourceAction.bind(null, lessonId)} submitLabel="Ajouter le lien">
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title} error={s?.fieldErrors?.title} />
          <Field name="external_url" label="Lien (https)" type="url" required defaultValue={s?.values?.external_url} error={s?.fieldErrors?.external_url} />
          <SelectField
            name="kind"
            label="Type"
            defaultValue={s?.values?.kind ?? 'link'}
            options={[
              { value: 'link', label: 'Lien' },
              { value: 'pdf', label: 'PDF' },
              { value: 'audio', label: 'Audio' },
              { value: 'video', label: 'Vidéo' },
              { value: 'document', label: 'Document' },
            ]}
          />
        </div>
      )}
    </ActionForm>
  );
}

export function EnrollForms({ courseId, groups }: { courseId: string; groups: { id: string; name: string }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ActionForm action={enrollByEmailAction.bind(null, courseId)} submitLabel="Inscrire l’élève">
        {(s) => <Field name="email" label="E-mail de l’élève" type="email" required defaultValue={s?.values?.email} error={s?.fieldErrors?.email} hint="L’élève doit avoir créé son compte." />}
      </ActionForm>
      {groups.length > 0 && (
        <ActionForm action={enrollGroupAction.bind(null, courseId)} submitLabel="Inscrire le groupe">
          {(s) => (
            <SelectField
              name="group_id"
              label="Inscrire tout un groupe"
              options={[{ value: '', label: 'Choisir un groupe…' }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
              error={s?.fieldErrors?.group_id}
            />
          )}
        </ActionForm>
      )}
    </div>
  );
}
