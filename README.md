# Solfège Progression

> **Apprendre la musique** — plateforme interactive d'apprentissage du solfège,
> avec le Formateur Anoh Cyrille.

Application web en français, pensée d'abord pour les smartphones Android et
les connexions limitées (Afrique francophone), utilisable aussi sur tablette
et ordinateur.

## État actuel

| Fonctionnalité | État |
|---|---|
| Accueil, navigation (barre mobile en bas d'écran), tableau de bord élève | ✅ |
| **Module 1 — Laboratoire de lecture des notes** | ✅ terminé et testé |
| Historique, score par clé, notes à revoir, reprise d'évaluation | ✅ (sur l'appareil) |
| **Module 2 — Laboratoire rythmique** (exercices, métronome, pulsation) | ✅ |
| **Module 3 — Tonalités et gammes** (exercices, explorateur de gammes, cycle des quintes) | ✅ |
| **Module 4 — Intervalles et théorie** (accès selon le niveau) et **test de positionnement** | ✅ |
| Comptes (administrateur, formateur, élève), Supabase, cours, devoirs, lives | 🔜 étape 7–8 |

Pour l'instant, **aucun compte n'est nécessaire** : les résultats sont
enregistrés dans le navigateur de l'élève (et l'interface le dit clairement).
Ils seront synchronisés avec le compte quand l'authentification arrivera.

### Le laboratoire de lecture des notes

- Clé de sol, clé de fa ou les deux, sur de vraies portées (VexFlow).
- 4 niveaux : dans la portée → lignes supplémentaires → plusieurs octaves → altérations.
- Réponse par boutons (nom de la note) ou par clavier de piano (nom **et** octave),
  raccourcis clavier `1`–`7` ou `C`–`B` sur ordinateur.
- Mode **entraînement** (correction immédiate expliquée : « En clé de fa, la note
  sur le 2e interligne est Do 2 ») et mode **évaluation** (série fixe, corrigée à la fin).
- Notation française (Do Ré Mi, Do 3 = do central) ou internationale (C D E, C4).
- Son facultatif (Web Audio) : l'exercice fonctionne entièrement sans le son.

Détails techniques et plan complet : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Installation

Prérequis : Node.js ≥ 20.9 (testé avec Node 22) et npm.

```bash
npm install          # .npmrc active legacy-peer-deps (dépendances facultatives de Vitest)
npm run dev          # http://localhost:3000
```

Aucune variable d'environnement n'est nécessaire à cette étape. Celles de
Supabase sont déjà documentées dans [`.env.example`](.env.example).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | compilation et serveur de production |
| `npm run lint` | ESLint (règles Next.js + TypeScript) |
| `npm run typecheck` | vérification TypeScript |
| `npm test` | tests unitaires Vitest (règles musicales, correction, séances, stockage) |
| `npm run test:e2e` | test de bout en bout dans Chromium (après `npm run build`) |
| `npm run test:e2e:labs` | test de bout en bout des laboratoires à questions |

Le test de bout en bout joue 120 questions sur téléphone (360 px) : il relit
chaque note **dans le dessin SVG** (position de la tête de note par rapport aux
lignes, clé, altération), en déduit la réponse, et vérifie que l'application la
valide. Il teste aussi la correction d'une erreur, la reprise d'une évaluation
après rechargement, l'historique et l'absence de défilement horizontal.
Variables utiles : `BASE_URL`, `CHROMIUM_PATH`, `SCREENSHOTS_DIR`.

## Déploiement (Vercel)

1. Importer le dépôt dans Vercel (framework détecté : Next.js).
2. Aucune variable n'est requise pour cette version.
3. Déployer. Les pages sont statiques et la police musicale est servie depuis `/fonts`.

## Ce qui demandera une configuration externe (étapes suivantes)

- **Supabase** (étape 7) : créer un projet Supabase dédié à Solfège Progression, renseigner les variables de
  `.env.example` dans Vercel, appliquer les migrations SQL qui seront fournies.
- **Visioconférence** (étape 8) : simples liens externes (Zoom, Google Meet, Jitsi…).

## Licences

Police musicale Bravura : SIL Open Font License (voir `public/fonts/LICENSE-Bravura.txt`).
