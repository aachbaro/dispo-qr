# ExtraBeam

ExtraBeam est une plateforme pour extras, freelances et micro-entreprises de la restauration: profil public, disponibilites, missions, puis facturation.

## Ce Qu'Il Faut Savoir En Premier

Le dossier `extrabeam/` contient deux mondes:

- un legacy encore riche fonctionnellement
- une `v2/` qui est la vraie base active de reconstruction

Decision par defaut:

- continuer le dev dans `v2/`
- garder le legacy comme memoire produit et technique

## Carte Du Dossier

| Dossier | Role | Statut |
| --- | --- | --- |
| `extrabeam-frontend/` | frontend Vue 3 legacy | reference produit/UI |
| `extrabeam-backend/` | backend NestJS legacy | reference technique |
| `api/` | anciennes fonctions serverless | heritage historique |
| `supabase/` | migrations et schema legacy | utile pour migration de donnees |
| `v2/` | nouveau socle Django + React | base active |

## Etat Actuel

### Legacy

Le legacy couvre encore une partie importante du produit complet:

- auth historique
- page publique
- CV
- disponibilites
- missions
- templates client
- factures
- Stripe
- emails et notifications

Mais il est plus heterogene et ce n'est plus la bonne base pour construire la suite.

### v2

La `v2/` couvre deja un noyau coherent:

- auth partagee via `auth-server`
- login/register local et Google gardes pour le debug
- profil public
- skills
- slots
- indisponibilites
- missions cote owner

Ce qui manque encore par rapport au legacy:

- espace client
- contacts client
- templates de mission
- factures
- paiements Stripe
- abonnement
- notifications
- experiences et education completes

Le detail est documente dans `v2/docs/MIGRATION_AUDIT.md`.

## Point D'Entree Recommande

### Dev

```bash
cd v2
./start-dev.sh
```

### Prod

```bash
cd v2
./start-prod.sh
```

## Docs A Lire

- `v2/README.md`: vue d'ensemble de la nouvelle base
- `v2/docs/MIGRATION_AUDIT.md`: ce qui est migre vs encore legacy
- `v2/docs/LEGACY_MAP.md`: carte rapide du legacy
- `extrabeam-backend/README.md`: uniquement si tu dois replonger dans le backend legacy

## Resume Court

- `v2/` = chantier actif
- legacy = reference
- ne plus ajouter de nouvelles features dans le legacy sauf besoin de maintenance tres cible
