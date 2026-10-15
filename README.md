# Solfège Progression

> **Apprendre la musique** — plateforme interactive d’apprentissage du solfège
> et de la théorie musicale, avec le Formateur Anoh Cyrille.

Application web en français, pensée d’abord pour les smartphones Android et les
connexions limitées (Afrique francophone), utilisable aussi sur tablette et ordinateur.

## Ce que fait la plateforme

### Sans compte (dès maintenant, même hors connexion)

| Laboratoire | Contenu |
|---|---|
| **1. Lecture des notes** | Clé de sol et de fa, lignes supplémentaires, octaves, altérations ; réponse par boutons ou clavier de piano ; entraînement et évaluation |
| **2. Rythme, temps et mesures** | Figures, silences, figures pointées, triolets, mesures simples et composées, syncopes, tempo ; métronome ; exercice de pulsation |
| **3. Tonalités et gammes** | Tons et demi-tons, armures, cycle des quintes, gammes majeures et mineures (naturelle, harmonique, mélodique), degrés, orthographe ; explorateur de gammes |
| **4. Intervalles et théorie** | Intervalles, accords, renversements, degrés et fonctions, lecture mélodique, cadences — ouvert selon le niveau |
| **Test de positionnement** | 15 questions, niveau estimé, domaines à travailler |

Correction immédiate et expliquée, historique et recommandations enregistrés
sur l’appareil, partitions dessinées avec VexFlow et vérifiées.

### Avec un compte (Supabase)

- **Élève** : tableau de bord (dernière leçon, « Reprendre mon apprentissage »,
  progression, objectif de la semaine, exercices recommandés, résultats, prochain
  live), profil musical, cours et leçons avec reprise, ressources
  téléchargeables, exercices corrigés par la base, devoirs, lives et replays,
  annonces, import des résultats faits sans compte.
- **Formateur** : cours / modules / leçons / ressources, publication, exercices
  et évaluations (écrits ou générés par les laboratoires), groupes, fiche élève
  (niveau, déblocage, commentaires, compétences), devoirs et correction, lives,
  annonces, statistiques (élèves en difficulté, devoirs à corriger, exercices).
- **Administrateur** : comptes et rôles, publication de tous les contenus,
  annonces, paramètres, statistiques générales.

Toutes les données affichées proviennent de la base ou de l’appareil : aucun chiffre fictif.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/SUPABASE.md`](docs/SUPABASE.md) | Créer et configurer le projet Supabase, premier administrateur, comptes de démonstration |
| [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md) | Mise en ligne sur Vercel, variables, recette |
| [`docs/SECURITE.md`](docs/SECURITE.md) | Politiques d’accès par rôle, protections, tests, limites |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture, logique musicale, modèle de données |

## Installation

Prérequis : Node.js ≥ 20.9 (testé avec Node 22) et npm.

```bash
npm install          # .npmrc active legacy-peer-deps (dépendances facultatives de Vitest)
cp .env.example .env.local   # facultatif : variables Supabase
npm run dev          # http://localhost:3000
```

Sans variables Supabase, le site fonctionne en mode « laboratoires sans compte ».

## Scripts et tests

| Commande | Rôle |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | développement, compilation, production |
| `npm run lint` · `npm run typecheck` | ESLint, TypeScript |
| `npm test` | 110 tests unitaires (théorie musicale, moteur d’exercices, validation, statistiques…) |
| `npm run test:db` | 103 vérifications de sécurité sur un PostgreSQL temporaire (binaires PostgreSQL requis) |
| `npm run test:e2e` | lecture des notes dans Chromium : 120 notes relues dans le SVG, reprise, historique, hors connexion |
| `npm run test:e2e:labs` | laboratoires rythme, tonalités, intervalles (tous niveaux, évaluation, accès au module 4) |
| `npm run test:e2e:espaces` | toutes les pages élève / formateur / administrateur avec un faux serveur Supabase |

Ces vérifications sont relancées automatiquement par GitHub Actions à chaque pull request (`.github/workflows/ci.yml`).

Les tests `test:e2e*` nécessitent `npm run build` (sauf `test:e2e:espaces`, qui
compile lui-même) et Chromium (variable `CHROMIUM_PATH` si besoin).

## Structure

```
src/app/            pages (laboratoires, espaces, cours, authentification, API de fichiers)
src/components/     interface (notation, laboratoires, académie, formulaires…)
src/lib/music/      théorie musicale pure et testée (hauteurs, portée, gammes, intervalles, accords)
src/lib/rhythm/     durées exactes, mesures, pulsation
src/lib/exercises/  moteur d’exercices générique
src/lib/theory/     générateurs d’exercices (tonalités, intervalles, notes)
supabase/           migrations SQL et tests de sécurité
scripts/            tests de bout en bout, faux serveur Supabase, données de démonstration
```

## Licences

Police musicale Bravura : SIL Open Font License (voir `public/fonts/LICENSE-Bravura.txt`).
