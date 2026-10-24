# Site « Apprendre la musique » — Formateur Anoh Cyrille

Site vitrine et de vente des formations : solfège, lecture de partition, piano,
harmonie et oreille musicale. React 19 + Vite + CSS Modules, sans aucune autre
dépendance (≈ 86 Ko de JavaScript compressé : rapide même en 3G).

Ce dossier est **indépendant** de la plateforme d'exercices (application Next.js
à la racine du dépôt). Il se déploie comme un projet Vercel à part.

## Démarrer en local

Prérequis : Node.js ≥ 20.9.

```bash
cd site-vitrine
npm install
npm run dev        # http://localhost:5173
npm run build      # vérification TypeScript + compilation dans dist/
npm run preview    # teste la version compilée
```

## Tout se modifie dans `src/config/`

| Fichier | Contenu |
|---|---|
| `site.ts` | Nom, **numéro WhatsApp**, téléphone, e-mail, réseaux sociaux, photos, textes de l'accueil, du formateur, de la communauté, **mode aperçu** |
| `formations.ts` | Catalogue : titres, textes, programme, **boutons de chaque formation** |
| `offres.ts` | Tarifs et offres (prix `null` = « Tarif sur demande ») |
| `videos.ts` | Vidéos YouTube ou fichiers vidéo |
| `temoignages.ts` | Témoignages (vides au départ : n'ajoutez que de vrais témoignages) |
| `faq.ts` | Questions fréquentes |

### Boutons configurables

Chaque bouton est décrit par une action (voir `src/config/types.ts`) :

```ts
{ libelle: 'S’inscrire', action: { type: 'inscription', formation: 'piano' } }      // formulaire pré-rempli
{ libelle: 'Une question ?', action: { type: 'whatsapp', message: 'Bonjour…' } }    // WhatsApp
{ libelle: 'Payer', action: { type: 'lien', url: 'https://…', nouvelOnglet: true } } // lien externe
{ libelle: 'Voir les tarifs', action: { type: 'section', id: 'tarifs' } }           // défilement
```

### WhatsApp

Renseignez `contact.whatsapp` dans `site.ts` (format international, chiffres
uniquement, ex. `2250700000000`). Tous les boutons WhatsApp s'activent, et les
demandes d'inscription sont envoyées par WhatsApp avec un message pré-rempli.

### Photos et vidéos

Déposez les photos dans `public/images/` (voir `public/images/LISEZ-MOI.txt`),
puis indiquez leur chemin, ex. `formateurAccueil: '/images/formateur.jpg'`.

### Mode aperçu

`site.afficherEmplacements: true` affiche des emplacements « À compléter » pour
tout ce qui manque (photos, vidéos, témoignages, prix, coordonnées, réponses de
FAQ). **Passez-le à `false` avant la mise en ligne** : ce qui est vide est alors masqué.

## Pages

| Adresse | Rôle |
|---|---|
| `/` | Accueil (toutes les sections) |
| `/inscription?formation=piano&offre=parcours-complet` | Formulaire d'inscription pré-rempli |
| `/confirmation?statut=…&ref=…` | Confirmation après inscription ou retour de paiement |

Statuts de confirmation : `inscription-envoyee`, `inscription-whatsapp`, `apercu`,
`paiement-en-attente`, `paiement-reussi`, `paiement-echoue`, `paiement-annule`.

## Inscriptions et paiement : points d'intégration

**Aucun paiement réel n'est effectué ni simulé.**

- **Inscriptions** — `src/services/inscription.ts`. Par défaut : WhatsApp.
  Pour recevoir les demandes ailleurs (Formspree, Make, Zapier, Google Apps
  Script, votre API), définissez `VITE_INSCRIPTION_ENDPOINT` : la demande y est
  envoyée en POST JSON.
- **Paiement Mobile Money / carte** — `src/services/paiement/` (côté navigateur)
  et `api/paiement/` (fonctions serveur Vercel, qui répondent pour l'instant
  « 501 non configuré »). Pour l'activer :
  1. ouvrez un compte chez un prestataire couvrant vos pays (Mobile Money et/ou carte) ;
  2. mettez sa clé secrète dans les variables Vercel (sans préfixe `VITE_`) ;
  3. complétez `api/paiement/initier.js` (créer la transaction, renvoyer `{ url }`)
     et `api/paiement/notification.js` (vérifier et enregistrer le paiement) ;
  4. définissez `VITE_PAIEMENT_ENDPOINT=/api/paiement/initier` et donnez un prix aux offres.
  Le formulaire propose alors « Continuer vers le paiement ». La page
  `/confirmation` n'affiche qu'un message : seule la notification serveur fait foi.

## Publier sur Vercel

1. Sur <https://vercel.com>, **Add New… > Project**, importez le dépôt GitHub
   `solfege-progression`.
2. **Root Directory** : cliquez sur **Edit** et choisissez `site-vitrine`.
   Vercel détecte **Vite** (build `npm run build`, sortie `dist`).
3. (Facultatif) **Environment Variables** : `VITE_INSCRIPTION_ENDPOINT`,
   `VITE_PAIEMENT_ENDPOINT` (voir `.env.example`).
4. **Deploy**. Chaque modification poussée sur GitHub redéploie le site.
5. Nom de domaine : **Settings > Domains**.

`vercel.json` renvoie `/inscription` et `/confirmation` vers l'application et
met en cache longue durée les fichiers compilés.

### Sans GitHub

Récupérez le dossier `site-vitrine` (sur GitHub : **Code > Download ZIP**, puis
gardez uniquement ce dossier), puis :

```bash
cd site-vitrine
npm install
npx vercel          # première fois : crée le projet
npx vercel --prod   # mise en production
```

## Structure

```
site-vitrine/
├── api/paiement/        fonctions serveur Vercel (points d'intégration du paiement)
├── public/              favicon, images/, videos/
├── src/
│   ├── config/          ← TOUT le contenu modifiable
│   ├── components/      en-tête, pied de page, bouton configurable, icônes…
│   ├── sections/        sections de l'accueil (une par fichier + son CSS)
│   ├── pages/           Accueil, Inscription, Confirmation, 404
│   ├── services/        inscription, paiement
│   ├── lib/             routeur, WhatsApp, références
│   └── styles/global.css  couleurs, polices, boutons (variables CSS)
├── vercel.json
└── .env.example
```

Couleurs et polices : variables en tête de `src/styles/global.css`.
Ordre des sections : `src/pages/Accueil.tsx`.

La clé de sol provient de la police Bravura (SIL Open Font License, voir
`public/fonts/LICENSE-Bravura.txt` à la racine du dépôt).
