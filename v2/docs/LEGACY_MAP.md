# Legacy Map

Ce document sert juste a garder les reperes pendant la reconstruction.

## Version historique a consulter

- `../extrabeam-frontend/`: frontend Vue 3 historique
- `../extrabeam-backend/`: backend NestJS historique
- `../api/`: anciennes routes serverless
- `../supabase/`: migrations et traces du modele de donnees

## Ce que le legacy couvre deja

- auth et onboarding
- page publique / entreprise
- CV
- disponibilites et indisponibilites
- missions
- templates client
- factures
- Stripe
- emails / notifications

## Ce que la v2 doit garder en tete

- ExtraBeam n'est pas juste une vitrine
- le coeur produit reste: profil visible + disponibilites + mission + facture
- il faut proteger la lisibilite du projet: moins de couches, moins de recouvrement, moins de dette structurelle
