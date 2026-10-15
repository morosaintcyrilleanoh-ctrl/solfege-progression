'use client';

import { attachSubmissionFileAction, submitAssignmentAction } from '@/app/cours/actions';
import { FileUpload } from '@/components/academy/FileUpload';
import { ActionForm, Field } from '@/components/forms/Form';

export function SubmissionForm({ assignmentId, content }: { assignmentId: string; content: string }) {
  return (
    <ActionForm action={submitAssignmentAction.bind(null, assignmentId)} submitLabel="Envoyer mon travail" pendingLabel="Envoi…">
      {(s) => <Field name="content" label="Ton travail (texte)" as="textarea" rows={6} maxLength={10000} defaultValue={s?.values?.content ?? content} error={s?.fieldErrors?.content} />}
    </ActionForm>
  );
}

export function SubmissionUpload({ assignmentId, userId }: { assignmentId: string; userId: string }) {
  return (
    <FileUpload
      bucket="submissions"
      folder={`${assignmentId}/${userId}`}
      label="Joindre un fichier (photo de ta partition, enregistrement audio, PDF)"
      onUploaded={(f) => attachSubmissionFileAction(assignmentId, f.path)}
    />
  );
}
