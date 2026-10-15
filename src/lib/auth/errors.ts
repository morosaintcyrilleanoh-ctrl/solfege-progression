/** Messages d'erreur d'authentification en français, sans révéler d'information sensible. */
export function authErrorMessage(error: { message?: string; code?: string; status?: number } | null | undefined): string {
  const code = error?.code ?? '';
  const msg = (error?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Adresse e-mail ou mot de passe incorrect.';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Confirme d’abord ton adresse e-mail grâce au lien reçu.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Un compte existe déjà avec cette adresse. Connecte-toi ou réinitialise ton mot de passe.';
  if (code === 'weak_password' || msg.includes('password should')) return 'Mot de passe trop faible : au moins 8 caractères, avec lettres et chiffres.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || error?.status === 429)
    return 'Trop de tentatives. Patiente quelques minutes avant de réessayer.';
  if (code === 'signup_disabled' || msg.includes('signups not allowed')) return 'Les inscriptions sont fermées pour le moment.';
  if (code === 'same_password') return 'Le nouveau mot de passe doit être différent de l’ancien.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Connexion au serveur impossible. Vérifie ta connexion Internet et réessaie.';
  return 'Une erreur est survenue. Réessaie dans un instant.';
}
