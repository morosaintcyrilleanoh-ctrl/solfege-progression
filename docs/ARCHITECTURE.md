# Architecture de Solfège Progression

## 1. Principes

1. **La théorie musicale est du code pur, testé.** `src/lib/music` et
   `src/lib/note-reading` ne dépendent ni de React, ni du navigateur, ni de
   VexFlow. Chaque règle (position d'une note, correction, score) est vérifiée
   par des tests automatisés.
2. **Le rendu est vérifié contre la logique.** La portée (VexFlow) compare,
   après dessin, la position de la tête de note à celle calculée par
   `lib/music/staff.ts`. En cas d'écart, la note n'est pas montrée. Le test de
   bout en bout relit en plus la note dans le SVG de façon indépendante.
3. **Honnêteté des données.** Aucune donnée fictive n'est affichée comme réelle ;
   une sauvegarde n'est annoncée que si l'écriture a réellement réussi.
4. **Mobile et connexion limitée d'abord.** Pages statiques, VexFlow chargé
   uniquement dans les laboratoires, police musicale locale mise en cache,
   synthèse sonore sans fichier audio, application utilisable sans le son.

## 2. Pile technique

| Besoin | Choix | Remarque |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5.9 strict | |
| Style | Tailwind CSS 4 (configuration dans `src/app/globals.css`) | jetons de couleur : `night`, `accent`, `electric`, `success` |
| Notation | VexFlow 5 (`vexflow/core`, import dynamique) + police Bravura locale | `public/fonts/bravura.woff2` (OFL) |
| Son | Web Audio API (`src/lib/audio/synth.ts`) | aucun fichier à télécharger |
| Tests | Vitest (logique) + script Playwright/Chromium (bout en bout) | |
| Données (étape 7) | Supabase : Auth, Postgres, RLS, Storage | migrations SQL dans `supabase/migrations` |
| Hébergement | Vercel | |

## 3. Arborescence

```
src/
  app/                      Pages (App Router)
    page.tsx                Accueil
    tableau-de-bord/        Tableau de bord élève (données locales réelles)
    laboratoires/           Liste des modules
      lecture-des-notes/    Module 1 + historique
  components/
    layout/                 En-tête, navigation mobile, bandeau de page
    ui/                     Boutons, cartes, badges, barres de progression, icônes
    notation/Staff.tsx      Portée VexFlow avec vérification de position
    instruments/            Clavier de piano
    labs/note-reading/      Laboratoire de lecture des notes
    dashboard/              Tableau de bord
  lib/
    music/                  pitch.ts (hauteurs, orthographe, notations), staff.ts (clés, positions)
    note-reading/           niveaux, génération/correction, séance (réducteur), statistiques, historique, réglages
    storage/                accès sûr au stockage du navigateur
    audio/                  synthétiseur Web Audio
scripts/
  e2e-note-lab.mjs          test de bout en bout (Chromium)
  extract-music-font.mjs    extraction de la police Bravura
```

## 4. Module 1 — Lecture des notes (terminé)

- **Modèle** : une hauteur = lettre + altération + octave (convention
  scientifique interne, C4 = do central). La position sur la portée est un
  « step » (demi-interligne) au-dessus de la 1re ligne : Mi4 en clé de sol,
  Sol2 en clé de fa. Les altérations ne changent pas la position ; deux
  enharmoniques (Fa♯/Sol♭) ne s'écrivent pas au même endroit.
- **Niveaux** : 1 dans la portée · 2 avec une ligne supplémentaire · 3 jusqu'à
  trois lignes supplémentaires · 4 avec dièses et bémols.
- **Réponses** : boutons (vérifie le nom et l'altération) ou clavier de piano
  (vérifie la touche exacte, donc l'octave). Raccourcis clavier 1–7 / C–B.
- **Modes** : entraînement (correction immédiate expliquée, notes manquées
  plus fréquentes) et évaluation (série fixe, corrigée à la fin, reprise
  possible après interruption ou rechargement).
- **Affichage** : noms français (Do Ré Mi) ou internationaux (C D E), octaves
  françaises (Do 3 = do central) ou internationales (C4).
- **Suivi** : historique, score par clé, graphique des séances, notes à revoir
  (réussies < 70 % sur au moins 2 essais).
- **Limite assumée** : l'exercice mesure la reconnaissance visuelle des notes,
  pas la justesse, le rythme ni l'oreille ; c'est écrit à l'élève.

## 5. Plan de développement

| Étape | Contenu | État |
|---|---|---|
| 1 | Inspection de l'existant | ✅ |
| 2 | Architecture et plan (ce document) | ✅ |
| 3 | Interface responsive (accueil, navigation, tableau de bord) | ✅ sans données fictives |
| 4 | Laboratoire de lecture des notes | ✅ testé |
| 5 | Laboratoire rythmique (durées en fractions exactes, métronome Web Audio) | à faire |
| 6 | Tonalités et gammes (orthographe par degrés, armures, cycle des quintes) | à faire |
| 7 | Supabase : authentification, rôles, migrations, RLS, synchronisation de l'historique local | à faire |
| 8 | Cours, ressources, devoirs, lives | à faire |
| 9 | Statistiques formateur, tests de permissions | à faire |
| 10 | Déploiement et documentation finale | à faire |

## 6. Modèle de données prévu (étape 7)

Tables : `profiles` (rôle : `admin` · `trainer` · `student`), `courses`,
`modules`, `lessons`, `lesson_resources`, `exercises`, `exercise_questions`,
`exercise_attempts`, `enrollments`, `assignments`, `assignment_submissions`,
`groups`, `group_members`, `live_sessions`, `announcements`,
`learning_progress`, plus `platform_settings`.

Règles d'accès principales (RLS) :

- un élève ne lit et n'écrit que ses propres tentatives, progressions et rendus ;
- un formateur ne voit que les élèves de ses groupes et les contenus qu'il possède ;
- l'administrateur gère rôles, publication et paramètres ;
- le rôle est modifiable uniquement par un administrateur (fonction SQL
  `security definer`), jamais par l'utilisateur lui-même ;
- ressources privées et replays : Storage privé + URL signées générées côté serveur.

Le format de `StoredSession` (`src/lib/note-reading/history.ts`) correspond
déjà à `exercise_attempts` pour importer l'historique local à la première connexion.

Solfège Progression utilise son **propre projet Supabase**, indépendant de tout
autre projet.
