import { describe, expect, it } from 'vitest';
import { isProtectedPath, safeNextPath } from '@/lib/auth/redirects';
import { authErrorMessage } from '@/lib/auth/errors';
import { fieldErrors, profileSchema, signUpSchema } from './forms';

describe('validation des formulaires', () => {
  const valid = { first_name: ' Aya ', last_name: '', email: ' AYA@Example.org ', password: 'solfege2026', password_confirm: 'solfege2026', consent: 'on' };
  it('accepte une inscription valide et nettoie les champs', () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.first_name).toBe('Aya');
      expect(r.data.email).toBe('aya@example.org');
    }
  });
  it('refuse les mots de passe faibles ou différents, l’e-mail invalide, l’absence de consentement', () => {
    const r = signUpSchema.safeParse({ ...valid, email: 'pas-un-email', password: 'court', password_confirm: 'autre', consent: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(Object.keys(e).sort()).toEqual(['consent', 'email', 'password'].sort());
    }
    const mismatch = signUpSchema.safeParse({ ...valid, password_confirm: 'solfege2027' });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(fieldErrors(mismatch.error).password_confirm).toMatch(/correspondent/);
    expect(signUpSchema.safeParse({ ...valid, password: 'abcdefgh', password_confirm: 'abcdefgh' }).success).toBe(false);
  });
  it('borne les champs du profil comme la base', () => {
    expect(profileSchema.safeParse({ first_name: 'A', last_name: '', instrument: '', country: '', musical_background: '', goals: '', weekly_goal: '100' }).success).toBe(true);
    expect(profileSchema.safeParse({ first_name: 'A', last_name: '', instrument: 'x'.repeat(81), country: '', musical_background: '', goals: '', weekly_goal: '5' }).success).toBe(false);
  });
});

describe('redirections sûres', () => {
  it('n’accepte que des chemins internes', () => {
    expect(safeNextPath('/espace/eleve')).toBe('/espace/eleve');
    expect(safeNextPath('https://evil.example')).toBe('/espace');
    expect(safeNextPath('//evil.example')).toBe('/espace');
    expect(safeNextPath('/\\evil.example')).toBe('/espace');
    expect(safeNextPath('/a\r\nSet-Cookie: x')).toBe('/espace');
    expect(safeNextPath(null)).toBe('/espace');
  });
  it('reconnaît les routes privées', () => {
    expect(isProtectedPath('/espace')).toBe(true);
    expect(isProtectedPath('/espace/formateur/cours')).toBe(true);
    expect(isProtectedPath('/cours/abc')).toBe(true);
    expect(isProtectedPath('/laboratoires/rythme')).toBe(false);
    expect(isProtectedPath('/espaces')).toBe(false);
  });
  it('traduit les erreurs sans détails techniques', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Adresse e-mail ou mot de passe incorrect.');
    expect(authErrorMessage({ status: 429 })).toMatch(/Trop de tentatives/);
    expect(authErrorMessage({ message: 'boom' })).toMatch(/erreur est survenue/);
  });
});
