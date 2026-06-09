# Recipe Local Generator

Application web locale qui genere des recettes de saison via LM Studio (API locale), avec historique MongoDB pour limiter les repetitions par ingredient principal.

## Prerequis

- Node.js 20+
- MongoDB local demarre
- LM Studio lance avec API locale active

## Configuration

1. Copier le fichier d environnement:

```bash
cp .env.example .env.local
```

2. Installer les dependances:

```bash
npm install
```

3. Lancer l application:

```bash
npm run dev
```

4. Ouvrir http://localhost:3000

## Scripts utiles

- `npm run dev` lance le serveur local
- `npm run lint` lance ESLint
- `npm run test` lance les tests unitaires
- `npm run test:e2e` lance les tests Playwright
- `npm run build` compile l application

## Variables d environnement

- `MONGODB_URI` URL de connexion MongoDB
- `MONGODB_DB_NAME` nom de la base
- `LM_STUDIO_BASE_URL` URL API locale LM Studio (ex: http://127.0.0.1:1234)

## Fonctionnalites

- Generation de 7 recettes par defaut (modifiable)
- Filtres categories: entree, apero, plat, salade, dessert
- Profil nutritionnel equilibré/leger
- Saisonnalite basee sur le mois courant
- Apercu des recettes puis details complets
- Historique pour limiter les repetitions d ingredient principal
- Choix du modele LM Studio depuis la liste detectee
