'use client';

import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/primitives';

/** Bouton d'action qui demande confirmation (suppression…). */
export function ConfirmButton({
  action,
  label,
  confirm,
  variant = 'ghost',
  className = '',
}: {
  action: () => Promise<void>;
  label: string;
  confirm?: string;
  variant?: 'ghost' | 'secondary' | 'primary';
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <Pending label={label} variant={variant} className={className} />
    </form>
  );
}

function Pending({ label, variant, className }: { label: string; variant: 'ghost' | 'secondary' | 'primary'; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${buttonClasses(variant)} ${variant === 'ghost' ? 'text-danger-700' : ''} ${className}`}>
      {pending ? '…' : label}
    </button>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  error,
  hint,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  error?: string;
  hint?: string;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        aria-invalid={!!error}
        className={`min-h-12 w-full rounded-xl border-2 bg-white px-3 ${error ? 'border-danger-500' : 'border-slate-300'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-danger-700">{error}</p>}
    </div>
  );
}

export function CheckboxField({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 accent-electric-500" />
      <span>
        <span className="font-semibold text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon (invisible pour les élèves)' },
  { value: 'published', label: 'Publié' },
];

export const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];
