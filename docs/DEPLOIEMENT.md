# Mettre Solfège Progression en ligne (Vercel)

## 1. Importer le dépôt

1. Créez un compte sur <https://vercel.com/signup> avec **Continue with GitHub**
   (offre **Hobby** gratuite pour démarrer).
2. **Add New… > Project**, puis **Import** du dépôt `solfege-progression`.
3. Vercel reconnaît Next.js : ne changez ni la commande de build ni le dossier.

## 2. Variables d’environnement

Dans **Settings > Environment Variables** (ou à l’import), ajoutez :

| Nom | Valeur | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | pour les comptes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé publique (publishable / anon) | pour les comptes |
| `NEXT_PUBLIC_SITE_URL` | adresse du site, ex. `https://solfege-progression.vercel.app` | recommandé (liens des e-mails) |

Choisissez le type **Config** (et non **Secret**) pour ces trois variables : elles
sont publiques par nature (visibles dans le navigateur). Une variable `NEXT_PUBLIC_…`
enregistrée comme **Secret** empêche la connexion de fonctionner. Une variable
Secret ne peut pas être convertie : supprimez-la et recréez-la en Config.

Sans ces variables, le site fonctionne en mode « laboratoires sans compte ».

**Ne définissez jamais `SUPABASE_SECRET_KEY` dans Vercel** : le site n’en a pas
besoin. Elle ne sert qu’au script de démonstration lancé en local.

Après tout changement de variable : **Deployments > ⋯ > Redeploy** (les
variables `NEXT_PUBLIC_…` sont intégrées au moment de la compilation).

**Région** : le fichier `vercel.json` place le site à Paris (`cdg1`), à côté de
la base Supabase (eu-west-3). C’est important pour la rapidité : chaque page
fait plusieurs échanges avec la base. Si votre projet Supabase est ailleurs,
adaptez `vercel.json` (ou **Settings > Functions > Function Region**).

## 3. Déployer

**Deploy**, puis attendez 1 à 2 minutes. L’adresse du site s’affiche
(`…vercel.app`). Chaque modification de la branche `main` est ensuite
déployée automatiquement ; chaque pull request reçoit une adresse de prévisualisation.

Nom de domaine personnalisé : **Settings > Domains**. Pensez alors à mettre à
jour **Site URL** et **Redirect URLs** dans Supabase, ainsi que `NEXT_PUBLIC_SITE_URL`.

## 4. Recette après la mise en ligne

À faire une fois, sur téléphone et sur ordinateur :

1. **Laboratoires** : lecture de notes, rythme, tonalités ; passer en mode
   avion après une première visite, puis recharger : les laboratoires restent utilisables.
2. **Inscription** d’un compte élève, réception de l’e-mail, confirmation.
3. Promotion du premier **administrateur** (voir `docs/SUPABASE.md`), puis
   attribution du rôle **formateur** à un second compte.
4. **Formateur** : créer un cours, un module, une leçon (texte, vidéo, PDF),
   publier ; créer un groupe et y ajouter l’élève par son e-mail ; créer un
   exercice (générer 5 questions), le publier ; créer un devoir ; programmer un live.
5. **Élève** : voir le cours, lire la leçon, télécharger le PDF, faire
   l’exercice (correction affichée), rendre le devoir avec un fichier,
   voir le live, importer les résultats faits sans compte.
6. **Formateur** : voir le rendu, le corriger, consulter la fiche de l’élève,
   écrire un commentaire, débloquer le module 4.
7. **Contrôles d’accès** : avec le compte élève, ouvrir
   `/espace/formateur` et `/espace/admin` → « Accès refusé ».

## 5. Commandes utiles en local

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
```
