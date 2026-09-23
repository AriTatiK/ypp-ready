# Guide : mettre YPPReady en ligne (gratuitement)

Ce guide est pour vous, Ariane, sur votre MacBook. Il explique comment rendre
le site accessible à n'importe qui dans le monde, sans payer d'hébergement.
Cela se fait en 4 grandes étapes : préparer une base de données en ligne
(Turso), mettre le code sur GitHub, puis le connecter à un hébergeur
(Render). Comptez environ 30-45 minutes la première fois.

Vous aurez besoin d'ouvrir l'application **Terminal** sur votre Mac
(Cmd+Espace, tapez "Terminal", Entrée) et de coller des commandes une par
une.

---

## Étape 0 — Préparer le projet

1. Téléchargez et dézippez le fichier `ypp-ready.zip` (celui que je vous ai
   envoyé), par exemple dans votre dossier Documents.
2. Dans Terminal, allez dans ce dossier (remplacez le chemin si besoin) :
   ```bash
   cd ~/Documents/ypp-ready
   ```
3. Installez les dépendances du projet :
   ```bash
   npm install
   ```

---

## Étape 1 — Créer une base de données gratuite (Turso)

Turso stocke vos données (comptes, questions, progression des utilisateurs)
en ligne, gratuitement.

1. Allez sur **[turso.tech](https://turso.tech)** et créez un compte gratuit
   (aucune carte bancaire demandée).
2. Dans Terminal, installez l'outil Turso :
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. Connectez-vous :
   ```bash
   turso auth login
   ```
   (Cela ouvre votre navigateur pour confirmer la connexion.)
4. Créez la base de données :
   ```bash
   turso db create yppready
   ```
5. Récupérez les deux informations dont l'application a besoin — copiez-les
   quelque part, vous en aurez besoin plusieurs fois :
   ```bash
   turso db show yppready --url
   turso db tokens create yppready
   ```
   La première commande vous donne une adresse (commence par `libsql://`) :
   c'est votre **TURSO_DATABASE_URL**. La seconde vous donne un long code :
   c'est votre **TURSO_AUTH_TOKEN**.

6. Remplissez la base avec le contenu du site (questions, leçons, comptes de
   démonstration) — collez cette commande en remplaçant les deux valeurs par
   les vôtres :
   ```bash
   TURSO_DATABASE_URL="collez_votre_url_ici" TURSO_AUTH_TOKEN="collez_votre_token_ici" npm run seed
   ```
   Vous devriez voir "Seed complete." à la fin. Vous n'aurez besoin de
   refaire cette étape que si vous ajoutez du nouveau contenu plus tard.

---

## Étape 2 — Mettre le code sur GitHub

GitHub est l'endroit où votre code va vivre ; c'est ce que Render lira pour
déployer le site.

1. Créez un compte gratuit sur **[github.com](https://github.com)** si vous
   n'en avez pas.
2. Sur GitHub, cliquez sur le bouton "+" en haut à droite → **New
   repository**. Donnez-lui un nom, par exemple `ypp-ready` (privé ou public,
   comme vous préférez), puis **Create repository**. Ne cochez aucune case
   d'initialisation (pas de README, pas de .gitignore) — le projet en a déjà.
3. Dans Terminal, toujours dans le dossier du projet, tapez (remplacez
   `VOTRE-NOM-UTILISATEUR` par votre nom d'utilisateur GitHub) :
   ```bash
   git init
   git add .
   git commit -m "YPPReady - premiere mise en ligne"
   git branch -M main
   git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/ypp-ready.git
   git push -u origin main
   ```
   GitHub vous demandera de vous connecter (une fenêtre de connexion peut
   s'ouvrir, ou on vous demandera un "personal access token" — GitHub vous
   guide directement si c'est le cas).

---

## Étape 3 — Déployer sur Render

1. Créez un compte gratuit sur **[render.com](https://render.com)** (aucune
   carte bancaire demandée pour le plan gratuit). Le plus simple est de vous
   connecter directement avec votre compte GitHub.
2. Sur le tableau de bord Render, cliquez sur **New** → **Blueprint**.
3. Choisissez votre dépôt `ypp-ready`. Render va lire un fichier déjà présent
   dans le projet (`render.yaml`) et proposer automatiquement la
   configuration d'un site gratuit.
4. Render va vous demander de renseigner 3 valeurs secrètes :
   - **SESSION_SECRET** : une longue chaîne de caractères aléatoires. Vous
     pouvez en générer une dans Terminal avec :
     ```bash
     openssl rand -hex 32
     ```
     puis copier le résultat.
   - **TURSO_DATABASE_URL** et **TURSO_AUTH_TOKEN** : les deux valeurs de
     l'étape 1.
5. Cliquez sur **Deploy** (ou **Apply**). Le premier déploiement prend
   quelques minutes. Une fois terminé, Render vous donne une adresse du
   type `https://yppready.onrender.com` — c'est le lien public de votre
   site, à partager avec qui vous voulez.

À savoir : le plan gratuit de Render "s'endort" après 15 minutes sans
visite, et met 30 à 60 secondes à se réveiller à la prochaine visite (le
premier visiteur après une pause verra une page qui met un peu de temps à
charger, c'est normal). C'est une limite du plan gratuit ; on pourra
regarder des options payantes plus tard si le site prend de l'ampleur.

Chaque fois que vous (ou moi) modifierez le code et ferez `git push`, Render
redéploiera automatiquement la nouvelle version.

---

## Après la mise en ligne

Une fois ces 3 comptes créés (Turso, GitHub, Render), toute la suite
(nouvelles fonctionnalités, mises à jour de contenu, corrections) pourra se
faire sans que vous ayez à refaire ces étapes — je pourrai vous donner le
code déjà prêt, et vous n'aurez qu'à faire `git push` (ou je vous guiderai
pour le faire).

La prochaine grande étape, une fois le site en ligne, sera de construire le
système de veille automatique sur les appels à candidatures (vérification
périodique des sites officiels, avec votre validation avant toute
publication) — comme nous en avons discuté.
