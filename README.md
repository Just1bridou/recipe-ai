# Recipe Local Generator

Application web qui genere des recettes de saison via ChatGPT (par defaut) ou LM Studio (API locale), avec historique MongoDB pour limiter les repetitions par ingredient principal. Protegee par mot de passe.

## Prerequis

- Node.js 20+
- MongoDB (local ou distant)
- Une cle API OpenAI **ou** LM Studio lance avec API locale active

## Configuration

1. Copier le fichier d environnement:

```bash
cp .env.example .env
```

2. Remplir les variables dans `.env` (voir section ci-dessous)

3. Installer les dependances:

```bash
npm install
```

4. Lancer l application:

```bash
npm run dev
```

5. Ouvrir http://localhost:9006

## Variables d environnement

| Variable | Description |
|---|---|
| `MONGODB_URI` | URL de connexion MongoDB |
| `MONGODB_DB_NAME` | Nom de la base de donnees |
| `LM_STUDIO_BASE_URL` | URL API locale LM Studio (ex: `http://127.0.0.1:1234`) |
| `OPENAI_API_KEY` | Cle API OpenAI (requise pour le provider ChatGPT) |
| `APP_PASSWORD` | Mot de passe pour acceder a l application |
| `APP_SESSION_SECRET` | Secret HMAC pour signer les cookies de session (min. 32 caracteres) |

Generer un secret de session:

```bash
openssl rand -hex 32
```

## Providers IA

Le provider se choisit depuis le panneau reglages de l application :

- **ChatGPT** (defaut) — utilise `gpt-4.1-nano` via l API OpenAI. Necessite `OPENAI_API_KEY`.
- **LM Studio** — utilise un modele charge localement. Necessite LM Studio demarre avec l API active.

## Deploiement Docker

Build et lancement via Docker Compose (Traefik requis sur le serveur) :

```bash
docker compose up -d --build
```

L application ecoute sur le port **9006** et est exposee sur `recipe.justinam.fr` via Traefik avec TLS automatique.

Le fichier `.env` du serveur doit contenir toutes les variables listees ci-dessus. Il n est jamais inclus dans l image Docker.

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de developpement (port 9006) |
| `npm run build` | Compile l application |
| `npm run start` | Serveur de production (port 9006) |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |

## Fonctionnalites

- Generation de recettes saisonnieres (7 par defaut, modifiable)
- Filtres categories : entree, apero, plat, salade, dessert
- Profil nutritionnel equilibre / leger
- Saisonnalite basee sur le mois courant
- Apercu des recettes puis details complets
- Historique pour limiter les repetitions d ingredient principal
- Protection par mot de passe avec session cookie signe (HMAC-SHA256, 7 jours)
