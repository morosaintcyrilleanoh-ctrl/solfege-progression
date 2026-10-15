'use client';

import { type ReactNode, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/primitives';
import type { ActionResult } from '@/lib/validation/forms';

export type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/** Formulaire relié à une action serveur : affiche le vrai résultat (succès ou erreur), jamais un succès simulé. */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = 'Enregistrement…',
  className = '',
}: {
  action: FormAction;
  children: (state: ActionResult | null) => ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={`space-y-4 ${className}`} noValidate>
      {children(state)}
      {state?.message && (
        <p
          role={state.ok ? 'status' : 'alert'}
          className={`rounded-xl p-3 text-sm ${state.ok ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}
        >
          {state.message}
        </p>
      )}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${buttonClasses('primary', 'lg')} w-full sm:w-auto`}>
      {pending && <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Field({
  name,
  label,
  type = 'text',
  error,
  defaultValue,
  autoComplete,
  required,
  hint,
  as,
  rows = 4,
  maxLength,
  min,
  max,
  inputMode,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  defaultValue?: string | number | null;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  as?: 'textarea';
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  inputMode?: 'numeric' | 'email' | 'text' | 'url';
}) {
  const id = `f-${name}`;
  const cls = `w-full rounded-xl border-2 bg-white px-3 py-2.5 text-base outline-none transition-colors focus:border-electric-500 ${
    error ? 'border-danger-500' : 'border-slate-300'
  }`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </label>
      {as === 'textarea' ? (
        <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? ''} maxLength={maxLength} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cls} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue ?? undefined}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`${cls} min-h-12`}
        />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
