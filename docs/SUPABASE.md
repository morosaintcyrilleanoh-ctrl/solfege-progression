# Configurer Supabase pour Solfège Progression

Supabase fournit les comptes (connexion, inscription), la base de données et
le stockage privé des fichiers. Sans Supabase, le site fonctionne quand même :
les laboratoires sont utilisables sans compte, avec un historique enregistré
sur l’appareil.

Durée : environ 30 minutes. Aucune ligne de commande n’est obligatoire.

---

## 1. Créer le projet

1. Créez un compte sur <https://supabase.com> (offre gratuite possible pour démarrer).
2. **New project** :
   - **Name** : `solfege-progression` ;
   - **Database password** : générez-le et conservez-le dans un gestionnaire de mots de passe ;
   - **Region** : la plus proche de vos élèves. Pour l’Afrique de l’Ouest et centrale, choisissez
     **Europe (Paris ou Frankfurt)**.
3. Attendez la fin de la création (1 à 2 minutes).

> Utilisez un projet **dédié** à Solfège Progression. L’ancienne application
> « Music Progression Lab » utilise un autre schéma : ne mélangez pas les deux.

## 2. Créer les tables et les règles de sécurité

Dans **SQL Editor** > **New query**, exécutez **dans l’ordre**, un fichier à la
fois (copier tout le contenu, coller, puis **Run**) :

1. `supabase/migrations/20261015120000_schema.sql` — tables, contraintes, index ;
2. `supabase/migrations/20261015120100_security.sql` — règles d’accès (RLS) ;
3. `supabase/migrations/20261015120200_functions.sql` — opérations sensibles ;
4. `supabase/migrations/20261015120300_storage.sql` — fichiers privés ;
5. `supabase/migrations/20261016120000_invitation.sql` — code d’invitation.

Chaque exécution doit se terminer par « Success. No rows returned ».

- Ouvrez chaque fichier sur GitHub et utilisez le bouton **Copy raw file** (ou l’adresse
  `…/raw/main/supabase/migrations/<fichier>`) pour copier tout le contenu.
- Si Supabase affiche « Potential issue detected » (tables sans RLS), choisissez
  **Run and enable RLS** : c’est une fausse alerte, les fichiers activent eux-mêmes
  le RLS sur toutes les tables, mais l’outil ne le détecte pas.
- Pour une mise à jour (projet déjà installé), n’exécutez **que les nouveaux fichiers**.

Variante en ligne de commande (pour les développeurs) :

```bash
npx supabase login
npx supabase link --project-ref <identifiant-du-projet>
npx supabase db push
```

Vérifications (dans **SQL Editor**) :

```sql
select count(*) filter (where c.relrowsecurity) as tables_protegees, count(*) as tables
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r';   -- attendu : 20 et 20
select id, public from storage.buckets order by id; -- attendu : 3 lignes, public = false
```

Et dans l’interface :

- **Table Editor** : les tables `profiles`, `courses`, `lessons`… apparaissent
  avec la mention « RLS enabled » ;
- **Storage** : trois compartiments **privés** existent : `course-files`,
  `submissions`, `replays`.

## 3. Régler l’authentification

**Authentication > URL Configuration**

- **Site URL** : l’adresse publique du site, par exemple `https://solfege-progression.vercel.app` ;
- **Redirect URLs** : ajoutez `https://solfege-progression.vercel.app/auth/confirmation`
  (et `http://localhost:3000/auth/confirmation` pour le développement).

**Authentication > Emails > Templates** : les liens doivent passer par la page
de confirmation du site. **Sur l’offre gratuite, ces modèles ne sont modifiables
qu’après avoir configuré un SMTP** (voir plus bas) ; sans cela, les modèles par
défaut fonctionnent si l’élève ouvre le lien dans le navigateur où il s’est inscrit.
Dans chaque modèle, remplacez le lien par :

- **Confirm signup** :
  `{{ .SiteURL }}/auth/confirmation?token_hash={{ .TokenHash }}&type=email&suivant=/profil`
- **Reset password** :
  `{{ .SiteURL }}/auth/confirmation?token_hash={{ .TokenHash }}&type=recovery&suivant=/nouveau-mot-de-passe`
- **Magic link** (si utilisé) :
  `{{ .SiteURL }}/auth/confirmation?token_hash={{ .TokenHash }}&type=email&suivant=/espace`

Vous pouvez aussi traduire en français le texte des e-mails.

**Authentication > Sign In / Providers > Email**

- **Confirm email** : activé (recommandé) ;
- **Minimum password length** : 8.

**E-mails en production (important).** Le service d’envoi intégré de Supabase
est limité à quelques e-mails par heure et peut n’envoyer qu’aux membres de
l’équipe du projet. Avant d’ouvrir le site aux élèves, configurez un SMTP
(Brevo, Mailjet, Resend, Amazon SES…) dans **Authentication > Emails > SMTP Settings**.

**Réserver l’inscription à vos élèves** (recommandé) : dans l’espace
**Administration > Paramètres > Code d’invitation**, définissez un code et
donnez-le à vos élèves. Sans ce code, la base refuse la création du compte.
Gardez **Confirm email** activé. Si vous créez un compte depuis Supabase
(**Add user**) pendant qu’un code est actif et que Supabase répond « Database
error creating new user », videz le code dans les paramètres, créez le compte,
puis remettez le code.

**Fermer les inscriptions** (facultatif) : le réglage « Inscriptions ouvertes »
de l’espace administrateur bloque le formulaire du site. Pour une fermeture
complète, désactivez aussi **Allow new users to sign up** dans
**Authentication > Sign In / Providers**.

## 4. Relier le site

**Project Settings > API Keys** (ou **Data API**) : copiez

- l’**URL du projet** → `NEXT_PUBLIC_SUPABASE_URL` ;
- la clé **publishable** (ou « anon public ») → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Ces deux valeurs sont publiques : elles sont visibles dans le navigateur, et la
sécurité repose sur les règles de la base. **Ne mettez jamais la clé secrète
(`service_role` / `sb_secret_…`) dans Vercel ni dans le code.**

Voir `docs/DEPLOIEMENT.md` pour les saisir dans Vercel.

## 5. Créer le premier administrateur

1. Créez votre compte :
   - soit sur le site (**Créer un compte**, puis confirmation de l’e-mail) ;
   - soit, sans e-mail, dans Supabase : **Authentication > Users > Add user >
     Create new user**, avec **Auto Confirm User** coché.
2. Dans **SQL Editor**, exécutez (avec votre adresse et votre nom) :

   ```sql
   update public.profiles
   set role = 'admin', first_name = 'Prénom', last_name = 'Nom'
   where id = (select id from auth.users where email = 'votre.adresse@exemple.com')
   returning first_name, last_name, role;
   ```

3. Reconnectez-vous : l’espace **Administration** apparaît. Les rôles suivants
   (formateurs) s’attribuent ensuite depuis **Administration > Comptes**.

## 6. Comptes de démonstration (facultatif)

Le script `scripts/seed-demo.mjs` crée un formateur, un élève, un petit cours
publié et un exercice. Il se lance **uniquement sur votre ordinateur** :

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SECRET_KEY=sb_secret_xxxx \
node scripts/seed-demo.mjs --confirmer
```

- La clé secrète n’est lue que depuis l’environnement ; ne l’enregistrez nulle part.
- Les mots de passe sont générés aléatoirement et affichés **une seule fois**.
- Aucun compte administrateur n’est créé.
- Pour supprimer les comptes : **Authentication > Users** (leurs données suivent).

## 7. Sauvegardes

L’offre gratuite garde peu d’historique. Pour une utilisation réelle avec des
élèves, activez une offre avec sauvegardes quotidiennes, ou exportez
régulièrement la base (**Database > Backups**).
