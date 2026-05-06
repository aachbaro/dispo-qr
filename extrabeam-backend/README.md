# ExtraBeam Legacy Backend

Ce dossier contient le backend NestJS historique d'ExtraBeam.

## Statut

- utile comme reference technique
- plus le point d'entree recommande pour le dev principal
- la base active de reconstruction est `../v2/`

## Pourquoi Le Garder

Le legacy reste utile pour:

- relire les modules deja couverts
- verifier les workflows metier historiques
- preparer la migration des donnees et des endpoints

## Commandes Legacy

```bash
npm install
npm run start:dev
```

Tests:

```bash
npm run test
npm run test:e2e
```

## Modules Historiques A Connaitre

- `auth`
- `profiles`
- `entreprises`
- `missions`
- `factures`
- `clients`
- `payments`
- `subscription`
- `notifications`

## Decision Par Defaut

Si tu ne sais pas ou reprendre:

- ne repars pas d'ici
- va plutot dans `../v2/`
