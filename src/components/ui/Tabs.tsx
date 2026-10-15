'use client';

import { type ReactNode, useState } from 'react';

export function Tabs({ tabs, label }: { tabs: { id: string; label: string; content: ReactNode }[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
              active === t.id ? 'bg-night-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {active === t.id && t.content}
        </div>
      ))}
    </div>
  );
}
