import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

type BadgeTone = 'neutral' | 'accent' | 'electric' | 'success' | 'danger' | 'demo';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  accent: 'bg-accent-600/10 text-accent-700',
  electric: 'bg-electric-500/10 text-electric-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  demo: 'bg-amber-100 text-amber-800',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, label, tone = 'electric' }: { value: number; max: number; label: string; tone?: 'electric' | 'success' | 'accent' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === 'success' ? 'bg-success-500' : tone === 'accent' ? 'bg-accent-500' : 'bg-electric-500';
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${color} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

export function SegmentedControl<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  columns,
}: {
  legend: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-slate-700">{legend}</legend>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                selected
                  ? 'border-electric-500 bg-electric-500/10 text-electric-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {o.label}
              {o.hint && <span className="block text-[11px] font-normal text-slate-500">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-electric-500 peer-focus-visible:outline-3 peer-focus-visible:outline-electric-400" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function buttonClasses(variant: 'primary' | 'secondary' | 'ghost' | 'success' = 'primary', size: 'md' | 'lg' = 'md'): string {
  const sizes = size === 'lg' ? 'min-h-12 px-5 text-base' : 'min-h-11 px-4 text-sm';
  const variants = {
    primary: 'bg-electric-500 text-white shadow-sm hover:bg-electric-600 disabled:bg-slate-300',
    success: 'bg-success-600 text-white shadow-sm hover:bg-success-700',
    secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
  } as const;
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${sizes} ${variants[variant]}`;
}
