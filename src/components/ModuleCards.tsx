import Link from 'next/link';
import { Badge } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { MODULES } from '@/lib/modules';

export function ModuleCards() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {MODULES.map((m) => {
        const body = (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">Module {m.number}</span>
              {m.status === 'available' ? <Badge tone="success">Disponible</Badge> : <Badge>En préparation</Badge>}
            </div>
            <p className="mt-2 text-lg font-bold text-night-800">{m.title}</p>
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
            {m.href && (
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-electric-600">
                Ouvrir le laboratoire <Icon name="arrowRight" className="size-4" />
              </span>
            )}
          </>
        );
        return (
          <li key={m.id}>
            {m.href ? (
              <Link href={m.href} className="block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-electric-400 hover:shadow-md">
                {body}
              </Link>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5" aria-disabled="true">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
