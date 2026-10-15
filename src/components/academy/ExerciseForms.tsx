'use client';

import { useState } from 'react';
import { addQuestionAction, createExerciseAction, generateQuestionsAction, updateExerciseAction } from '@/app/espace/formateur/actions';
import { STATUS_OPTIONS, SelectField } from '@/components/forms/Controls';
import { ActionForm, Field } from '@/components/forms/Form';
import type { ExerciseRow } from '@/lib/supabase/database.types';

export function ExerciseForm({ exercise, courses, lessons }: { exercise?: ExerciseRow; courses: { id: string; title: string }[]; lessons: { id: string; title: string }[] }) {
  const action = exercise ? updateExerciseAction.bind(null, exercise.id) : createExerciseAction;
  return (
    <ActionForm action={action} submitLabel={exercise ? 'Enregistrer l’exercice' : 'Créer l’exercice'}>
      {(s) => (
        <>
          <Field name="title" label="Titre" required maxLength={160} defaultValue={s?.values?.title ?? exercise?.title} error={s?.fieldErrors?.title} />
          <Field name="description" label="Consigne" as="textarea" rows={3} maxLength={2000} defaultValue={s?.values?.description ?? exercise?.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="kind"
              label="Type"
              defaultValue={s?.values?.kind ?? exercise?.kind ?? 'practice'}
              options={[
                { value: 'practice', label: 'Entraînement' },
                { value: 'assessment', label: 'Évaluation' },
              ]}
            />
            <Field name="max_attempts" label="Tentatives maximum (vide = illimité)" type="number" min={1} max={100} defaultValue={s?.values?.max_attempts ?? exercise?.max_attempts} error={s?.fieldErrors?.max_attempts} />
            <SelectField name="course_id" label="Cours (élèves inscrits)" defaultValue={s?.values?.course_id ?? exercise?.course_id} options={[{ value: '', label: 'Aucun (via un devoir uniquement)' }, ...courses.map((c) => ({ value: c.id, label: c.title }))]} />
            <SelectField name="lesson_id" label="Leçon" defaultValue={s?.values?.lesson_id ?? exercise?.lesson_id} options={[{ value: '', label: 'Aucune' }, ...lessons.map((l) => ({ value: l.id, label: l.title }))]} />
          </div>
          <SelectField name="status" label="Publication" options={STATUS_OPTIONS} defaultValue={s?.values?.status ?? exercise?.status ?? 'draft'} />
        </>
      )}
    </ActionForm>
  );
}

export function QuestionForm({ exerciseId }: { exerciseId: string }) {
  const [type, setType] = useState<'mcq' | 'short' | 'match'>('mcq');
  return (
    <ActionForm action={addQuestionAction.bind(null, exerciseId)} submitLabel="Ajouter la question">
      {(s) => (
        <>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-slate-700">Type de question</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ['mcq', 'QCM'],
                ['short', 'Réponse courte'],
                ['match', 'Association'],
              ] as const).map(([v, l]) => (
                <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold ${type === v ? 'border-electric-500 bg-electric-500/10 text-electric-700' : 'border-slate-200'}`}>
                  <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <Field name="prompt" label="Énoncé" as="textarea" rows={2} maxLength={2000} defaultValue={s?.values?.prompt} error={s?.fieldErrors?.prompt} />
          {type === 'mcq' && (
            <>
              <Field name="choices" label="Choix (un par ligne)" as="textarea" rows={4} defaultValue={s?.values?.choices} error={s?.fieldErrors?.choices} />
              <Field name="correct_index" label="Numéro de la bonne réponse (ex. 2, ou 1,3)" defaultValue={s?.values?.correct_index} error={s?.fieldErrors?.correct_index} />
            </>
          )}
          {type === 'short' && (
            <>
              <Field name="accepted" label="Réponses acceptées (une par ligne)" as="textarea" rows={3} defaultValue={s?.values?.accepted} error={s?.fieldErrors?.accepted} hint="Accents, majuscules et ponctuation sont ignorés lors de la correction." />
              <SelectField name="answer_kind" label="Réponse attendue" defaultValue={s?.values?.answer_kind ?? 'text'} options={[{ value: 'text', label: 'Texte' }, { value: 'number', label: 'Nombre (accepte 1,5 ou 3/2)' }]} />
            </>
          )}
          {type === 'match' && (
            <Field name="pairs" label="Paires (une par ligne : gauche = droite)" as="textarea" rows={4} defaultValue={s?.values?.pairs} error={s?.fieldErrors?.pairs} hint="Ex. ronde = 4 temps" />
          )}
          <Field name="explanation" label="Explication montrée après la réponse" as="textarea" rows={2} maxLength={2000} defaultValue={s?.values?.explanation} />
          <Field name="skill" label="Compétence (facultatif)" maxLength={80} defaultValue={s?.values?.skill} hint="Ex. rythme.durees" />
        </>
      )}
    </ActionForm>
  );
}

export function GenerateForm({ exerciseId, generators }: { exerciseId: string; generators: { value: string; label: string }[] }) {
  return (
    <ActionForm action={generateQuestionsAction.bind(null, exerciseId)} submitLabel="Générer les questions" pendingLabel="Génération…">
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField name="generator" label="Type de question" options={[{ value: '', label: 'Choisir…' }, ...generators]} defaultValue={s?.values?.generator} error={s?.fieldErrors?.generator} />
          <SelectField name="difficulty" label="Difficulté" defaultValue={s?.values?.difficulty ?? '1'} options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]} />
          <Field name="count" label="Nombre" type="number" min={1} max={20} defaultValue={s?.values?.count ?? 5} error={s?.fieldErrors?.count} />
        </div>
      )}
    </ActionForm>
  );
}
