# Rebuild Plan

## But

Redemarrer ExtraBeam sur une base plus simple sans perdre la connaissance produit accumulee.

## Ordre de travail recommande

1. recadrer le noyau produit v2
2. definir l'architecture backend/frontend cible
3. reconstruire auth + session
4. reconstruire le profil et la page publique
5. reconstruire disponibilites et missions
6. seulement ensuite ajouter facturation, paiements et couches secondaires

## Principe important

La v2 n'a pas besoin de tout reimplementer tout de suite. Elle doit d'abord retrouver un noyau solide:

- identite claire
- modele metier simple
- interface propre
- workflows critiques testables

## Questions a trancher dans les prochaines sessions

- stack backend finale de la v2
- stack frontend finale de la v2
- niveau de compatibilite ou non avec l'ancien schema
- priorite exacte entre page publique, missions et facturation

