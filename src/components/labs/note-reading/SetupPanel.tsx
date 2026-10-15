'use client';

import { Card, SegmentedControl, Toggle, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { CLEF_CHOICES, LEVELS, LEVEL_IDS } from '@/lib/note-reading/levels';
import type { SessionMode } from '@/lib/note-reading/session';
import type { NoteLabSettings } from '@/lib/note-reading/settings';

interface SetupPanelProps {
  settings: NoteLabSettings;
  onChange: (patch: Partial<NoteLabSettings>) => void;
  onStart: (mode: SessionMode) => void;
  audioSupported: boolean;
}

export function SetupPanel({ settings, onChange, onStart, audioSupported }: SetupPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-5">
          <SegmentedControl
            legend="Clé"
            options={CLEF_CHOICES.map((c) => ({ value: c.id, label: c.label }))}
            value={settings.clefChoice}
            onChange={(clefChoice) => onChange({ clefChoice })}
          />

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-slate-700">Difficulté</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {LEVEL_IDS.map((id) => {
                const level = LEVELS[id];
                const selected = settings.level === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ level: id })}
                    className={`min-h-11 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selected ? 'border-electric-500 bg-electric-500/10' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${selected ? 'text-electric-700' : 'text-slate-800'}`}>{level.label}</span>
                    <span className="block text-xs text-slate-500">{level.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <SegmentedControl
            legend="Façon de répondre"
            options={[
              { value: 'buttons', label: 'Boutons', hint: 'nom de la note' },
              { value: 'piano', label: 'Clavier de piano', hint: 'nom et octave' },
            ]}
            value={settings.answerMode}
            onChange={(answerMode) => onChange({ answerMode })}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onStart('training')} className={`${buttonClasses('primary', 'lg')} w-full`}>
          <Icon name="play" className="size-5" /> Commencer l’entraînement
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => onStart('evaluation')} className={`${buttonClasses('secondary', 'lg')} flex-1`}>
            <Icon name="target" className="size-5" /> Évaluation
          </button>
          <label className="sr-only" htmlFor="eval-length">
            Nombre de questions
          </label>
          <select
            id="eval-length"
            value={settings.evaluationLength}
            onChange={(e) => onChange({ evaluationLength: Number(e.target.value) === 20 ? 20 : 10 })}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
          >
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        <strong>Entraînement</strong> : correction après chaque note, les notes que tu manques reviennent plus souvent.{' '}
        <strong>Évaluation</strong> : une série fixe, sans aide, corrigée à la fin.
      </p>

      <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-800">
          <span className="flex items-center gap-2">
            <Icon name="settings" className="size-4" /> Affichage et son
          </span>
          <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="mt-4 space-y-4">
          <SegmentedControl
            legend="Noms des notes"
            options={[
              { value: 'fr', label: 'Do Ré Mi' },
              { value: 'intl', label: 'C D E' },
            ]}
            value={settings.notation}
            onChange={(notation) => onChange({ notation })}
          />
          <SegmentedControl
            legend="Numéro des octaves"
            options={[
              { value: 'fr', label: 'Français', hint: 'do central = Do 3' },
              { value: 'intl', label: 'International', hint: 'do central = C4' },
            ]}
            value={settings.octaveConvention}
            onChange={(octaveConvention) => onChange({ octaveConvention })}
          />
          <Toggle
            label="Enchaîner après une bonne réponse"
            description="La question suivante s’affiche automatiquement."
            checked={settings.autoAdvance}
            onChange={(autoAdvance) => onChange({ autoAdvance })}
          />
          {audioSupported ? (
            <Toggle
              label="Entendre la note après ma réponse"
              description="En entraînement uniquement. L’exercice fonctionne aussi sans le son."
              checked={settings.sound}
              onChange={(sound) => onChange({ sound })}
            />
          ) : (
            <p className="text-xs text-slate-500">Le son n’est pas disponible sur ce navigateur ; l’exercice fonctionne sans.</p>
          )}
        </div>
      </details>
    </div>
  );
}
