'use client';

import {
  addCommentAction,
  addMemberAction,
  createAssignmentAction,
  createGroupAction,
  reviewSubmissionAction,
  setLevelAction,
} from '@/app/espace/formateur/actions';
import { LEVEL_OPTIONS, STATUS_OPTIONS, SelectField } from '@/components/forms/Controls';
import { ActionForm, Field } from '@/components/forms/Form';
import { LocalDateTimeInput } from '@/components/ui/LocalTime';

export function GroupForm() {
  return (
    <ActionForm action={createGroupAction} submitLabel="Créer le groupe">
      {(s) => (
        <>
          <Field name="name" label="Nom du groupe" required maxLength={120} defaultValue={s?.values?.name} error={s?.fieldErrors?.name} />
          <Field name="description" label="Description" as="textarea" rows={2} maxLength={1000} defaultValue={s?.values?.description} />
        </>
      )}
    </ActionForm>
  );
}

export function AddMemberForm({ groupId }: { groupId: string }) {
  return (
    <ActionForm action={addMemberAction.bind(null, groupId)} submitLabel="Ajouter l’élève">
      {(s) => <Field name="email" label="E-mail de l’élève" type="email" required defaultValue={s?.values?.email} error={s?.fieldErrors?.email} hint="L’élève doit avoir créé son compte. Son adresse n’est jamais affichée aux autres élèves." />}
    </ActionForm>
  );
}

export function LevelForm({ studentId, level }: { studentId: string; level: string }) {
  return (
    <ActionForm action={setLevelAction.bind(null, studentId)} submitLabel="Enregistrer le niveau">
      {() => <SelectField name="level" label="Niveau de l’élève" options={LEVEL_OPTIONS} defaultValue={level} />}
    </ActionForm>
  );
}

export function CommentForm({ studentId }: { studentId: string }) {
  return (
    <ActionForm action={addCommentAction.bind(null, studentId)} submitLabel="Envoyer le commentaire">
      {(s) => (
        <>
          <Field name="body" label="Commentaire pédagogique" as="textarea" rows={3} maxLength={4000} defaultValue={s?.ok ? '' : s?.values?.body} error={s?.fieldErrors?.body} />
          <Field name="context" label="Sujet (facultatif)" maxLength={160} defaultValue={s?.ok ? '' : s?.values?.context} hint="Ex. Lecture en clé de fa" />
        </>
      )}
    </ActionForm>
  );
}

export function AssignmentForm({
  groups,
  students,
  exercises,
  lessons,
}: {
  groups: { id: string; name: string }[];
  students: { id: string; name: string }[];
  exercises: { id: string; title: string }[];
  lessons: { id: string; title: string }[];
}) {
  return (
    <ActionForm action={createAssignmentAction} submitLabel="Créer le devoir">
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title} error={s?.fieldErrors?.title} />
          <Field name="instructions" label="Consignes" as="textarea" rows={5} maxLength={10000} defaultValue={s?.values?.instructions} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="group_id" label="Pour un groupe" defaultValue={s?.values?.group_id} error={s?.fieldErrors?.group_id} options={[{ value: '', label: '—' }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
            <SelectField name="student_id" label="… ou pour un élève" defaultValue={s?.values?.student_id} options={[{ value: '', label: '—' }, ...students.map((g) => ({ value: g.id, label: g.name }))]} />
            <SelectField name="exercise_id" label="Exercice à faire (facultatif)" defaultValue={s?.values?.exercise_id} options={[{ value: '', label: 'Aucun' }, ...exercises.map((e) => ({ value: e.id, label: e.title }))]} />
            <SelectField name="lesson_id" label="Leçon à étudier (facultatif)" defaultValue={s?.values?.lesson_id} options={[{ value: '', label: 'Aucune' }, ...lessons.map((l) => ({ value: l.id, label: l.title }))]} />
            <LocalDateTimeInput name="due_at" label="À rendre le (facultatif)" defaultIso={s?.values?.due_at || null} error={s?.fieldErrors?.due_at} />
            <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? 'published'} />
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function ReviewForm({ submissionId, assignmentId, score, feedback }: { submissionId: string; assignmentId: string; score: number | null; feedback: string | null }) {
  return (
    <ActionForm action={reviewSubmissionAction.bind(null, submissionId, assignmentId)} submitLabel="Enregistrer la correction">
      {(s) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="score" label="Note (sur 100, facultatif)" type="number" min={0} max={100} defaultValue={s?.values?.score ?? score} error={s?.fieldErrors?.score} />
            <SelectField
              name="status"
              label="Décision"
              defaultValue={s?.values?.status ?? 'reviewed'}
              options={[
                { value: 'reviewed', label: 'Corrigé' },
                { value: 'returned', label: 'À reprendre par l’élève' },
              ]}
            />
          </div>
          <Field name="feedback" label="Commentaire pour l’élève" as="textarea" rows={3} maxLength={4000} defaultValue={s?.values?.feedback ?? feedback} />
        </>
      )}
    </ActionForm>
  );
}
