# Migration Audit

Etat des lieux de la refactorisation `extrabeam -> v2`.

Date de lecture: 2026-04-09

Sources utilisees pour cet audit:

- `../extrabeam-frontend/`
- `../extrabeam-backend/`
- `../api/`
- `../supabase/`
- `../v2/backend/`
- `../v2/frontend/`

## Resume rapide

La v2 a deja depasse le simple prototype d'auth.

Aujourd'hui, elle couvre deja un noyau produit coherent:

- auth centralisee via `auth-server`
- login/register local et Google gardes en debug
- profil public avec slug
- edition d'un profil freelance simple
- skills
- slots de disponibilite
- indisponibilites
- missions cote owner

En revanche, la v2 n'a pas encore remplace le legacy sur les couches suivantes:

- espace client
- templates de mission
- contacts client
- factures
- paiements Stripe
- abonnement
- notifications
- uploads
- CV complet (experiences, formation)

Le chantier est donc a un stade:

- `v2 = noyau reconstruit`
- `legacy = produit complet mais heterogene`

## Lecture strategique

La refactorisation n'est pas une simple recopie.

Elle change aussi plusieurs choix de fond:

- frontend: `Vue 3` -> `React`
- backend: `NestJS + Supabase` -> `Django + DRF`
- auth: `Supabase auth / JWT` -> `auth-server` OIDC partage
- URL publique: logique `entreprise/:slug` -> logique profil public plus simple `p/:slug`

Donc certaines briques sont a migrer telles quelles, mais d'autres doivent etre repensees avant d'etre reportees dans la v2.

## Tableau Operationnel

| Domaine | Legacy | v2 | Statut | Decision | Prochaine action |
|---|---|---|---|---|---|
| Auth / session | Auth legacy dans `extrabeam-frontend` + `extrabeam-backend/src/auth` | OIDC partage via `auth-server` + fallback local/Google | Partiel | Reprendre, puis durcir | Finaliser la session v2 et supprimer progressivement les modes debug |
| Callback / onboarding | `/auth/callback` + `/auth/onboarding` | `/auth/callback` existe, onboarding absent | Partiel | Repenser | Redefinir un onboarding v2 minimal apres premiere connexion |
| Roles utilisateur | `client` / `freelance` / `admin` explicites dans le router et le backend | Pas de vrai systeme de roles metier dans v2 | Absent | Repenser | Reintroduire un modele de roles avant de migrer l'espace client |
| Profil public | `EntreprisePage.vue` + endpoints `entreprises` | `/p/:slug` + `ProfileOverviewView` | Reconstruit partiel | Reprendre | Stabiliser le profil public et verifier l'URL cible long terme |
| Identite publique | slug, nom, avatar, infos entreprise | slug, display name, avatar, bio, job title, location, phone | Reconstruit partiel | Reprendre | Ajouter les champs metier manquants si necessaire |
| CV profil | CV profile, skills, experiences, education | profile fields + skills seulement | Partiel | Migrer partiellement | Ajouter experiences et education en premier |
| Skills | Gerees cote CV | CRUD skills dans v2 | Reconstruit | Garder | Nettoyer l'UI et renforcer les tests |
| Experiences | Presente dans `entreprises/cv` legacy | Absente | Absent | Migrer | Ajouter modele + API + UI |
| Education | Presente dans `entreprises/cv` legacy | Absente | Absent | Migrer | Ajouter modele + API + UI |
| Disponibilites / slots | `entreprises/:ref/slots` | CRUD slots dans v2 | Reconstruit | Garder | Verifier collisions et regles metier |
| Indisponibilites | `entreprises/:ref/unavailabilities` | CRUD unavailabilities dans v2 | Reconstruit | Garder | Ajouter tests metier sur recurrence/exceptions |
| Agenda UI | Present dans la page entreprise legacy | Agenda React deja branche | Reconstruit partiel | Garder | Consolider UX et comportements de calendrier |
| Missions owner | Module `missions` complet cote backend | CRUD missions owner dans v2 | Reconstruit partiel | Reprendre | Ajouter la vraie logique de cycle de vie et cas publics |
| Proposition publique de mission | `POST /missions/public` dans legacy | Absente en v2 | Absent | Migrer | Refaire un flux public client/visiteur |
| Statuts de mission | Workflow plus riche legacy | Quelques statuts simples en v2 | Partiel | Repenser | Redefinir le state machine cible avant extension |
| Lien mission <-> agenda | Present via slots / calculs | Present via `Slot.mission` | Reconstruit partiel | Garder | Ajouter regles de validation et UX |
| Espace client | `ClientPage.vue` + module backend `clients` | Absent | Absent | Migrer apres roles | Reintroduire apres systeme de roles |
| Contacts client | Module `client-contacts` | Absent | Absent | Migrer | Garder pour phase client |
| Templates de mission | Module `mission-templates` | Absent | Absent | Migrer | Garder pour phase client |
| Factures | Page facture + module `factures` | Placeholder seulement | Absent | Migrer | Refaire apres missions stabilisees |
| Paiements Stripe | `payments` + webhooks | Absent | Absent | Migrer / simplifier | Redefinir un parcours paiement minimal v2 |
| Abonnement | `subscription` + page de gestion | Absent | Absent | Repenser | Decider si l'abonnement reste central dans v2 |
| Notifications / emails | Module `notifications` + Brevo | Absent | Absent | Migrer plus tard | Garder hors noyau initial |
| Uploads | Module `uploads` + URLs signees | Absent | Absent | Repenser | Decider stockage cible avant migration |
| API serverless `api/` | Couche historique encore presente | Non reprise | Legacy a archiver | Jeter a terme | Ne pas reporter telle quelle dans v2 |
| Couplage Supabase frontend | Tres present en legacy | Retire de v2 | Deja traite | Jeter | Ne pas reintroduire ce couplage |
| Base de donnees / migrations | Supabase SQL + schema historique | SQLite/Django models pour l'instant | Partiel | Repenser | Definir strategie de migration de donnees |
| Session frontend | Legacy heterogene selon auth | `localStorage` + token opaque | Transition | Repenser | Clarifier la cible: session backend, token DRF ou JWT court |
| Tests backend | Legacy Nest avec tests moduaires/e2e | Tests auth presents, metier encore leger | Partiel | Renforcer | Ajouter tests profil/agenda/missions |
| Tests frontend | Faible couverture observable | Build OK, peu ou pas de tests | Partiel | Renforcer | Introduire tests UI sur auth + profil public |

## Ce Qui Est Deja Vraiment Repris

Ces briques peuvent etre considerees comme deja migrees dans une premiere version exploitable:

- auth partagee `pascuans` via `auth-server`
- login / register / callback
- profil public de base
- skills
- slots
- indisponibilites
- missions owner

Attention: "repris" ne veut pas dire "fini". Cela veut surtout dire "le nouveau socle existe et merite d'etre consolide au lieu d'etre recommence".

## Ce Qui Est Encore Seulement En Legacy

Ces briques vivent encore principalement dans l'ancienne application:

- espace client
- contacts client
- templates de mission
- factures
- paiements Stripe
- abonnement
- notifications email
- uploads
- CV complet: experiences + education

## Ce Qu'Il Ne Faut Probablement Pas Refaire Tel Quel

### 1. Le couplage Supabase cote front

La v2 a bien fait de le retirer.

Il vaut mieux garder:

- `auth-server` pour l'identite
- Django pour le metier
- une front app plus legere et moins couplee a l'infra

### 2. Le dossier `api/` historique

Il a surtout une valeur memoire / transition.

Il ne doit pas redevenir une couche de reference pour la v2.

### 3. Le modele "entreprise partout"

Le legacy etait tres structure autour de `entreprise`.

La v2 est plus orientee `profil public`.

Il faut trancher proprement si le concept final reste:

- une personne freelance avec page publique
- ou une entite entreprise formelle

Avant de migrer facture / abonnement, cette decision doit etre stable.

## Les Gros Angles Morts Actuels De La v2

### 1. Le systeme de roles

C'est le plus gros trou structurel actuel.

Le legacy avait des parcours differents pour:

- freelance
- client
- admin

La v2 est aujourd'hui tres centree freelance.

Tant que ce modele n'est pas reintroduit, tout le pan client restera bloque ou bricole.

### 2. Le vrai parcours mission public

La v2 a du CRUD mission cote owner, mais pas encore le vrai tunnel "un client ou visiteur propose une mission".

Or c'est une partie du coeur produit.

### 3. La session metier

La v2 utilise encore un token opaque et `localStorage`.

C'est pratique pour avancer vite, mais ce n'est pas encore la forme cible la plus propre.

### 4. La migration de donnees

La v2 n'a pas encore de strategie explicite pour rapatrier:

- profils
- CV
- disponibilites
- missions
- factures

Depuis le schema Supabase / legacy.

## Ordre Recommande Pour La Suite

### Phase 1 - Consolider le noyau deja reconstruit

- stabiliser auth partagee
- stabiliser profil public
- stabiliser agenda
- stabiliser missions owner
- ajouter experiences + education

### Phase 2 - Reintroduire la logique client

- definir les roles
- refaire l'espace client
- refaire contacts client
- refaire templates de mission
- refaire proposition publique de mission

### Phase 3 - Refaire la couche business avancee

- factures
- paiements
- abonnement
- notifications

### Phase 4 - Migration de donnees et nettoyage

- definir la migration depuis Supabase
- importer les donnees utiles
- archiver les couches legacy devenues inutiles

## Priorites Concretes Recommandees

Si on veut avancer sans se disperser, les 5 prochaines taches les plus rationnelles sont:

1. reintroduire un vrai modele de roles `freelance/client/admin`
2. ajouter `experiences` et `education`
3. finir le vrai parcours mission public
4. consolider la session / auth v2
5. seulement ensuite attaquer `factures`

## Decision Par Defaut Proposee

Si rien n'est redecide, la ligne la plus saine est:

- garder `v2` comme seule base active de reconstruction
- laisser le legacy comme reference produit uniquement
- ne plus ajouter de nouvelles features au legacy
- utiliser cet audit comme source de priorisation pour les prochaines sessions
