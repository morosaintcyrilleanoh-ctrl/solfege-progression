# Sécurité et politiques d’accès

## Principes

1. **Défense en profondeur.** Chaque accès est contrôlé à trois niveaux :
   le proxy Next.js redirige les visiteurs non connectés ; chaque page et
   chaque action serveur vérifient l’utilisateur et son rôle ; la base de
   données applique ses propres règles (Row Level Security), même si une
   requête contournait l’interface.
2. **Aucune clé secrète dans l’application.** Le site n’utilise que l’URL et
   la clé publique de Supabase. La clé secrète ne sert qu’au script de
   démonstration lancé en local (`scripts/seed-demo.mjs`).
3. **Fermé par défaut.** Le RLS est activé sur toutes les tables ; tout ce qui
   n’est pas explicitement autorisé est refusé. Les visiteurs anonymes n’ont
   accès qu’aux réglages publics (`site.name`, `signup.open`).
4. **Honnêteté.** Une action n’annonce un succès que si la base confirme
   qu’une ligne a été modifiée ; sinon un message d’erreur réel est affiché.

## Qui peut faire quoi

| Donnée | Élève | Formateur | Administrateur |
|---|---|---|---|
| Profil | le sien (sauf rôle, niveau, activation) | ceux de ses élèves (lecture) | tous |
| Rôle, activation d’un compte | — | — | oui (fonctions `set_user_role`, `set_user_active` ; dernier admin protégé) |
| Niveau | via son test de positionnement | ses élèves (`set_student_level`) | tous |
| Cours, modules | catalogue publié | les siens (création, édition, publication) | tous |
| Leçons, ressources | publiées, cours où il est inscrit, niveau suffisant ou module débloqué | les siennes | toutes |
| Énoncés d’exercices | exercices accessibles (cours, leçon, devoir) | les siens | tous |
| **Corrigés** | **jamais** (correction dans la base) | les siens | tous |
| Résultats (tentatives) | les siens ; il n’enregistre lui-même que des séances de laboratoire | ceux de ses élèves | tous |
| Groupes | son appartenance uniquement | les siens ; ajout d’élèves par e-mail sans voir l’annuaire | tous |
| Devoirs | publiés pour lui ou son groupe | les siens | tous |
| Rendus | le sien ; ne peut pas modifier la note | ceux de ses devoirs ; ne peut pas modifier le travail de l’élève | tous |
| Lives | selon le public (tous, cours, groupe) | les siens | tous |
| Annonces | publiées pour son public | ses cours et groupes | toute la plateforme |
| Commentaires pédagogiques | ceux qui le concernent | ceux qu’il a écrits, pour ses élèves | tous |
| Paramètres | réglages publics | lecture | modification |

« Ses élèves » = membres de ses groupes ou inscrits à ses cours.

## Opérations sensibles validées dans la base

- `submit_exercise_attempt` : vérifie l’accès et le nombre de tentatives,
  corrige (normalisation identique à l’application), enregistre la tentative
  et le rendu du devoir.
- `set_user_role`, `set_user_active`, `admin_list_users`, `admin_overview` : administrateurs.
- `set_student_level`, `add_student_to_group`, `enroll_student`, `enroll_group` :
  formateur responsable (ou administrateur).
- `record_placement` : l’élève enregistre son test (scores contrôlés).
- Déclencheurs : le rôle est toujours « élève » à l’inscription (les données
  envoyées par le navigateur sont ignorées) ; le rôle, l’activation et le
  niveau sont protégés ; un élève ne peut pas modifier sa note, un formateur
  ne peut pas modifier le travail de l’élève.

## Fichiers privés

Compartiments privés `course-files`, `submissions`, `replays`, avec taille
maximale et types de fichiers autorisés. Les chemins encodent le cours, la
leçon, le devoir ou l’élève, et les politiques de stockage vérifient ces
identifiants. Les téléchargements passent par `/api/fichiers/…` : session
requise, ligne visible par l’utilisateur, puis lien signé valable 2 minutes.

## Autres protections

- Validation de toutes les entrées côté serveur (zod) avec les mêmes limites
  que les contraintes de la base.
- Redirections après connexion limitées aux chemins internes.
- Messages d’erreur d’authentification sans détail technique ; réponse
  identique que l’e-mail existe ou non (mot de passe oublié).
- En-têtes : `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`.
- Contenu des leçons affiché sans interpréter de HTML ; liens limités à https ;
  vidéos intégrées seulement depuis YouTube (sans cookie) et Vimeo.
- Le service worker ne met en cache que les pages publiques et les fichiers statiques.

## Tests

- `npm run test:db` : 103 vérifications sur un vrai PostgreSQL (migrations
  appliquées, scénarios élève / formateur / administrateur / visiteur).
- `npm test` : validation, redirections, normalisation, logique métier.
- `npm run test:e2e:espaces` : toutes les pages connectées, accès refusés selon le rôle.

## Limites connues

- Les séances de laboratoire sont corrigées dans le navigateur : ce sont des
  données d’entraînement déclaratives, présentées comme telles. Les
  exercices et évaluations des formateurs sont corrigés dans la base.
- Le test de positionnement est calculé dans le navigateur ; un élève averti
  pourrait déclarer un niveau supérieur. Le formateur voit les scores et
  peut corriger le niveau.
- La limitation du nombre de tentatives de connexion est assurée par Supabase Auth.
