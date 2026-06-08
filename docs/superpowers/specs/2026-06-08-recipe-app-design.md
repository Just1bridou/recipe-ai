# Design Spec: Application locale de generation de recettes saisonnieres

## 1. Contexte et objectif

Construire une web app locale qui genere des recettes de cuisine via une IA locale sur LM Studio, en privilegiant des propositions de saison, saines mais gourmandes.

Objectifs fonctionnels:
- Generer 7 recettes par defaut pour une semaine.
- Permettre de changer le nombre de recettes a generer.
- Permettre de cocher des categories: entree, apero, plat, salade, dessert.
- Afficher un apercu des recettes, puis les details au clic.
- Conserver un historique pour eviter de regenerer des recettes trop similaires.
- Utiliser LM Studio en local avec modele configurable depuis l app.

Choix utilisateur valides pendant le brainstorming:
- Profil nutritionnel par defaut: entre equilibre et leger.
- Regle anti-duplication: autoriser repetition si ingredient principal different.
- Type application: web app locale.
- Comportement categories: coche + repartition automatique sur les recettes.
- Saisonnalite: basee sur le mois (sans meteo).
- Configuration LM Studio: selection du modele via liste detectee par API.
- Stack retenue: Next.js avec MongoDB.

## 2. Architecture generale

Application monorepo Next.js (App Router), avec:
- Frontend React pour interface utilisateur.
- API routes Next.js pour logique metier et integration LM Studio.
- MongoDB pour persistance des recettes, generations hebdo, parametres et journaux techniques.

Flux principal:
1. L utilisateur configure filtres et nombre de recettes.
2. Le backend determine la saison selon le mois courant.
3. Le backend recupere l historique recent pour limiter les repetitions selon ingredient principal.
4. Le backend envoie un prompt structure a LM Studio avec le modele actif.
5. Le backend valide, normalise et filtre les recettes recues.
6. Le backend enregistre les resultats et renvoie l apercu a l UI.
7. L UI affiche les cartes, puis un detail complet au clic.

## 3. Donnees et persistance (MongoDB)

### 3.1 Collection settings
Champs:
- modelId: string
- modelTemperature: number (optionnel)
- maxTokens: number (optionnel)
- defaultRecipeCount: number (defaut 7)
- defaultNutritionProfile: string (equilibre-leger)
- createdAt: date
- updatedAt: date

### 3.2 Collection recipes
Champs:
- recipeId: string unique applicatif
- title: string
- category: entree | apero | plat | salade | dessert
- seasonTag: printemps | ete | automne | hiver
- nutritionTag: equilibre | leger
- mainIngredient: string
- preview: string
- details:
  - ingredients: string[]
  - steps: string[]
  - prepTime: number
  - cookTime: number
  - servings: number
  - healthTips: string[]
- sourceModelId: string
- generatedAt: date

### 3.3 Collection weekly_generations
Champs:
- weekKey: string (ex: 2026-W24)
- recipeIds: string[]
- filters:
  - categories: string[]
  - recipeCount: number
  - nutritionProfile: string
  - seasonMode: month-based
- createdAt: date

### 3.4 Collection generation_logs (optionnelle mais recommandee)
Champs:
- requestPrompt: string
- rawModelResponse: string
- parseStatus: success | partial | failed
- errors: string[]
- createdAt: date

## 4. Regles metier

### 4.1 Saisonnalite
- Le mois courant determine automatiquement la saison.
- La saison est injectee dans le prompt pour orienter les propositions.
- Exemples attendus:
  - Ete: recettes fraiches, salades, preparations legeres.
  - Hiver: recettes plus reconfortantes mais restant saines.

### 4.2 Repartition categories
- L utilisateur coche une ou plusieurs categories.
- Le backend repartit automatiquement le quota total entre categories cochees.
- La repartition vise un equilibre simple, avec correction en cas de manque de propositions valides.

### 4.3 Anti-duplication historique
- Regle primaire: eviter de proposer une recette avec un ingredient principal recemment utilise.
- Une recette est consideree suffisamment differente si son ingredient principal est different.
- Si le filtre est trop strict pour atteindre le quota:
  1. relacher progressivement la contrainte,
  2. completer le nombre demande,
  3. conserver une trace du fallback dans logs.

### 4.4 Generation hebdomadaire
- Valeur par defaut: 7 recettes.
- Valeur modifiable par l utilisateur avant generation.
- Chaque generation est associee a une cle de semaine.

## 5. API cible

### 5.1 GET /api/models
- Interroge LM Studio local pour lister les modeles disponibles.
- Retour: liste de modeles exploitables en UI.

### 5.2 GET /api/settings
- Retourne la configuration active.

### 5.3 PUT /api/settings
- Met a jour la configuration (modele actif, defaults, etc.).

### 5.4 POST /api/generations
Entree:
- recipeCount
- categories[]
- nutritionProfile

Traitement:
1. Calcul saison.
2. Chargement historique recent.
3. Construction prompt JSON strict.
4. Appel LM Studio (modele selectionne).
5. Parsing + validation schema.
6. Filtrage anti-duplication.
7. Fallback de completion si necessaire.
8. Sauvegarde recettes + weekly_generation + logs.

Sortie:
- liste de recettes d apercu et meta generation.

### 5.5 GET /api/generations/latest
- Retourne la derniere generation (apercu semaine).

### 5.6 GET /api/recipes/:id
- Retourne detail complet de recette.

## 6. Robustesse LM Studio

- Imposer une sortie JSON via prompt systeme.
- Valider cote serveur avant toute insertion.
- En cas de JSON invalide:
  1. nouvelle tentative limitee,
  2. puis erreur fonctionnelle claire si echec.
- Journaliser la reponse brute pour debug local.

## 7. UX et ecrans

Ecran principal:
- Formulaire generation (nombre, categories, profil).
- Bloc parametres IA (liste modeles LM Studio + modele actif).
- Zone resultats (cartes recettes en apercu).

Carte recette (apercu):
- titre
- categorie
- ingredient principal
- resume court
- temps total
- action voir detail

Vue detail recette:
- ingredients
- etapes
- temps prep/cuisson
- portions
- conseils sante
- badges saison/profil

Contraintes UX:
- Indicateur de generation en cours.
- Erreurs comprehensibles pour utilisateur non technique.
- Experience responsive desktop + mobile.

## 8. Strategie de tests

Tests unitaires:
- mapping saison par mois
- repartition categories cochees
- anti-duplication ingredient principal
- validation schema recette

Tests integration API:
- generation par defaut (7)
- generation nombre personnalise
- lecture modeles LM Studio
- recuperation latest generation
- recuperation detail recette
- persistance MongoDB

Tests UI (smoke):
- selection modele
- lancement generation
- affichage apercu
- ouverture detail
- verification responsive basique

## 9. Criteres d acceptation

- L utilisateur peut generer 7 recettes par defaut.
- Le nombre de recettes est modifiable.
- Les categories cochees sont respectees via repartition auto.
- La saison est deduite du mois et influence les recettes.
- Les recettes restent sur un axe sain et gourmand.
- L historique limite les redites selon ingredient principal.
- Le modele LM Studio est selectionnable depuis une liste detectee.
- Le flux apercu puis detail fonctionne de bout en bout.

## 10. Hors scope initial (YAGNI)

- Moteur nutritionnel avance (macro precise, calcul calories strict).
- Synchronisation cloud ou multi-utilisateur.
- Integration meteo temps reel.
- Generation de liste de courses automatique.
- Authentification.

## 11. Risques et mitigation

- LM Studio indisponible localement:
  - mitigation: test connexion et message guide demarrage.
- Reponses IA non conformes:
  - mitigation: schema strict + retry borne + logs.
- Variabilite qualite recette:
  - mitigation: prompt guide + contraintes de format + filtres.
- Trop peu de resultats uniques:
  - mitigation: strategie de relachement progressif.
