import { describe, expect, it } from 'vitest';
import { checkQuestion } from '@/lib/exercises/check';
import { seededRng } from '@/lib/random';
import { RHYTHM_EXERCISES } from '@/lib/rhythm/questions';
import { INTERVAL_EXERCISES } from '@/lib/theory/interval-questions';
import { assignmentSchema, liveSchema, questionSchema, slugify } from '@/lib/validation/academy';
import { questionFromRow, rowsFromForm, rowsFromQuestion } from './questions';
import { embedUrl } from './video';

describe('vidéos', () => {
  it('intègre YouTube (sans cookie) et Vimeo, refuse le reste', () => {
    expect(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(embedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(embedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789');
    expect(embedUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(embedUrl('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(embedUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('questions enregistrées', () => {
  it('une question générée, enregistrée puis relue, se corrige comme l’originale', () => {
    const rng = seededRng(3);
    for (const g of [...RHYTHM_EXERCISES, ...INTERVAL_EXERCISES]) {
      const q = g.generate(2, rng);
      const rows = rowsFromQuestion(q);
      const shown = questionFromRow({ id: 'x', ...rows.question });
      expect(shown.prompt).toBe(q.prompt);
      // Le corrigé n'est pas dans la question affichée.
      if (shown.type === 'mcq') expect(shown.correct).toEqual([]);
      if (shown.type === 'short') expect(shown.accepted).toEqual([]);
      // Le corrigé stocké accepte la bonne réponse.
      if (q.type === 'mcq') expect(rows.key.correct).toEqual(q.correct);
      if (q.type === 'match') {
        expect(checkQuestion(q, { type: 'match', mapping: rows.key.correct as string[] }).correct).toBe(true);
      }
    }
  });

  it('valide et convertit la saisie du formateur', () => {
    const mcq = questionSchema.parse({ type: 'mcq', prompt: 'Combien de temps dure une blanche ?', explanation: '', choices: '1 temps\n2 temps\n4 temps', correct_index: '2' });
    const rows = rowsFromForm(mcq);
    expect(rows.question.choices).toEqual([{ id: 'c1', label: '1 temps' }, { id: 'c2', label: '2 temps' }, { id: 'c3', label: '4 temps' }]);
    expect(rows.key.correct).toEqual(['c2']);
    expect(questionSchema.safeParse({ type: 'mcq', prompt: 'x', explanation: '', choices: 'seul', correct_index: '1' }).success).toBe(false);
    expect(questionSchema.safeParse({ type: 'mcq', prompt: 'x', explanation: '', choices: 'a\nb', correct_index: '5' }).success).toBe(false);
    const match = questionSchema.parse({ type: 'match', prompt: 'Associe', explanation: '', pairs: 'ronde = 4\nblanche = 2' });
    expect(rowsFromForm(match).key.correct).toEqual(['4', '2']);
    expect(questionSchema.safeParse({ type: 'match', prompt: 'x', explanation: '', pairs: 'a = 1\nb = 1' }).success).toBe(false);
    expect(questionSchema.safeParse({ type: 'short', prompt: 'x', explanation: '', accepted: '' }).success).toBe(false);
  });

  it('valide devoirs et lives', () => {
    expect(assignmentSchema.safeParse({ title: 'Devoir', instructions: '', group_id: '', student_id: '', exercise_id: '', lesson_id: '', due_at: '', status: 'draft' }).success).toBe(false);
    expect(liveSchema.safeParse({ title: 'Live', description: '', starts_at: '2026-11-01T18:00', duration_minutes: '60', meeting_url: 'http://meet', replay_url: '', audience: 'all', course_id: '', group_id: '', status: 'scheduled' }).success).toBe(false);
    expect(liveSchema.safeParse({ title: 'Live', description: '', starts_at: '2026-11-01T18:00', duration_minutes: '60', meeting_url: 'https://meet.jit.si/solfege', replay_url: '', audience: 'all', course_id: '', group_id: '', status: 'scheduled' }).success).toBe(true);
    expect(slugify('Solfège : les Bases !')).toBe('solfege-les-bases');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LessonContent } from './markdown';
import { formatSize, safeFileName } from './files';

describe('contenu des leçons', () => {
  it('affiche titres, listes, gras et liens https, sans interpréter le HTML', () => {
    const html = renderToStaticMarkup(
      createElement(LessonContent, { source: '# La portée\nUne **portée** a 5 lignes.\n\n- Clé de sol\n- Clé de fa\n\n<script>alert(1)</script>\n[Lien](https://exemple.org) [mauvais](javascript:alert(1))' }),
    );
    expect(html).toContain('<h2');
    expect(html).toContain('<strong>portée</strong>');
    expect(html).toContain('<li>Clé de sol</li>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('href="https://exemple.org"');
    expect(html).not.toContain('href="javascript');
  });
  it('nettoie les noms de fichiers', () => {
    expect(safeFileName('Leçon 1 : la clé de fa.PDF')).toBe('Lecon-1-la-cle-de-fa.pdf');
    expect(safeFileName('../../etc/passwd')).toBe('passwd');
    expect(safeFileName('C:\\dossier\\rendu final.mp3')).toBe('rendu-final.mp3');
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2,5 Mo');
  });
});
