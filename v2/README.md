# ExtraBeam v2

`extrabeam/v2/` est la base active de reconstruction d'ExtraBeam.

## Ce Qui Existe Deja

- backend Django sur `8002`
- frontend React/Vite sur `5180`
- auth partagee possible via `auth-server`
- fallback local et Google gardes pour le debug
- profil public
- skills
- slots
- indisponibilites
- missions cote owner

## Ce Qui Reste Encore En Legacy

- espace client
- contacts client
- templates de mission
- factures
- paiements Stripe
- abonnement
- notifications
- CV complet `experiences + education`

Voir `docs/MIGRATION_AUDIT.md` pour la carte complete.

## Lancement Dev Sur Linux

```bash
./start-dev.sh
```

Arret:

```bash
./stop-dev.sh
```

URLs:

- frontend: `http://127.0.0.1:5180`
- backend: `http://127.0.0.1:8002/api/`

## Lancement Prod Avec Docker

```bash
./start-prod.sh
```

Arret:

```bash
./stop-prod.sh
```

Par defaut, le frontend sort sur `http://127.0.0.1:8080`.

Fichiers a verifier avant exposition publique:

- `.env`
- `backend/.env.prod`

## Structure

```text
v2/
|- backend/              backend Django
|- frontend/             frontend React
|- docs/                 audit legacy -> v2
|- docker-compose.yml    stack prod
|- start-dev.sh
|- stop-dev.sh
|- start-prod.sh
|- stop-prod.sh
```

## Notes D'Architecture

- le legacy reste a cote comme reference produit
- la v2 ne doit pas reintroduire le couplage Supabase cote front
- `auth-server` est la brique d'identite partagee cible

## Lecture Recommandee

1. `docs/MIGRATION_AUDIT.md`
2. `docs/LEGACY_MAP.md`
3. `backend/README.md`
4. `frontend/README.md`
