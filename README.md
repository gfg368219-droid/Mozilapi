# MozAnim

Catalogue francophone d’animés, films, scans et webtoons, avec fiches de lecture, comptes et API à clés.

## Développement

- `npm run dev` lance l’aperçu Vite sur le port 5000.
- `npm run build` compile le site.
- `npm start` sert la version compilée et ses routes API.

Sur Railway et les autres hébergeurs, configurez `DATABASE_URL` avec une base PostgreSQL. `npm start` exécute automatiquement le pré-démarrage qui crée les tables et index définis dans `server/schema.sql`, sans ajouter ni générer d’épisodes dans la base. Sur Replit, les changements de schéma restent gérés par le flux de base Replit. Les mots de passe et les clés API ne sont pas enregistrés en clair.

La base stocke les comptes, sessions, clés API et œuvres importées. Les fiches, épisodes et lecteurs sont récupérés depuis la source du catalogue et actualisés à la demande.

Les fiches et lecteurs sont récupérés depuis Anime-Sama. Chaque clé API peut être limitée à des types de contenu et à la lecture seule ou à l’écriture.
