import { describe, expect, it } from 'vitest';
import { answersThisWeek, courseProgress, exerciseStats, recommendations, startOfWeek, strugglingStudents } from './stats';

const at = (user_id: string, score: number, max_score: number, created_at: string, extra = {}) => ({ user_id, score, max_score, created_at, ...extra });

describe('tableaux de bord', () => {
  it('commence la semaine le lundi', () => {
    const d = startOfWeek(new Date('2026-10-15T15:00:00')); // jeudi
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(12);
    expect(startOfWeek(new Date('2026-10-18T10:00:00')).getDate()).toBe(12); // dimanche
  });
  it('compte les réponses de la semaine', () => {
    const now = new Date('2026-10-15T12:00:00');
    expect(answersThisWeek([at('u', 8, 10, '2026-10-14T10:00:00'), at('u', 3, 5, '2026-10-13T10:00:00'), at('u', 9, 20, '2026-10-10T10:00:00')], now)).toBe(15);
  });
  it('calcule la progression par cours', () => {
    const p = courseProgress({ c1: ['l1', 'l2', 'l3', 'l4'], c2: [] }, [
      { lesson_id: 'l1', status: 'completed' },
      { lesson_id: 'l2', status: 'in_progress' },
      { lesson_id: 'x', status: 'completed' },
    ]);
    expect(p).toEqual([
      { courseId: 'c1', total: 4, completed: 1, inProgress: 1, percent: 25 },
      { courseId: 'c2', total: 0, completed: 0, inProgress: 0, percent: 0 },
    ]);
  });
  it('repère les élèves en difficulté avec un critère explicable', () => {
    const since = new Date('2026-10-01');
    const list = [
      at('a', 2, 10, '2026-10-05'), at('a', 3, 10, '2026-10-06'), at('a', 4, 10, '2026-10-07'),
      at('b', 9, 10, '2026-10-05'), at('b', 8, 10, '2026-10-06'), at('b', 9, 10, '2026-10-07'),
      at('c', 1, 10, '2026-10-05'), // trop peu de séances pour conclure
      at('d', 0, 10, '2026-09-01'), at('d', 0, 10, '2026-09-02'), at('d', 0, 10, '2026-09-03'), // trop ancien
    ];
    expect(strugglingStudents(list, { since }).map((s) => s.userId)).toEqual(['a']);
  });
  it('recommande les compétences peu réussies', () => {
    const r = recommendations([
      at('u', 0, 0, '2026-10-05', { details: { skills: { 'rythme.syncopes': { c: 2, t: 6 }, 'rythme.durees': { c: 9, t: 10 } } } }),
      at('u', 0, 0, '2026-10-06', { details: { skills: { 'tonalites.armures': { c: 1, t: 2 } } } }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ skill: 'rythme.syncopes', label: 'Syncopes', href: '/laboratoires/rythme' });
  });
  it('résume les tentatives par exercice', () => {
    const s = exerciseStats([at('a', 3, 4, '2026-10-05', { exercise_id: 'e' }), at('b', 1, 4, '2026-10-05', { exercise_id: 'e' }), at('a', 1, 1, '2026-10-05')]);
    expect(s.get('e')).toEqual({ attempts: 2, averagePercent: 50, students: 2 });
  });
});
