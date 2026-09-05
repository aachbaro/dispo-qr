# Lulu la Nantaise — carnet d’équipe

## Intention et périmètre

Prototype autonome dans ExtraBeam, accessible directement à `/lulu`. Aucun lien n’est ajouté à la navigation générale. La connexion utilise le prénom et un PIN personnel. La page cachée et la balise `noindex` ne constituent pas une protection : chaque lecture privée et chaque mutation sont authentifiées côté Django.

Une seule instance de restaurant existe. La salle et la plonge sont affectées par le générateur. La cuisine apparaît dans le même planning, avec des shifts fixes récurrents configurés par le responsable. Les cuisiniers ne sont jamais réaffectés par la génération.

Le prototype ne change ni les comptes ni les fonctionnalités historiques d’ExtraBeam. Il utilise son serveur Django, sa base de données et son application React, avec des tables, routes, styles et sessions distincts.

La publication est bloquée tant qu’un cuisinier actif n’a pas ses horaires fixes renseignés : cela évite de publier par erreur un planning sans sa présence.

## Parcours des utilisateurs

### Première préparation par Jean-Sébastien

1. Se connecter avec son PIN initial et ouvrir **Équipe**.
2. Vérifier chaque contrat hebdomadaire, les rôles et les compétences : clés, ouverture, fermeture. Les compétences sont indépendantes : demander l’ouverture ne demande les clés que si cette seconde exigence est également cochée.
3. Renseigner les shifts fixes des cuisiniers, jour et service par jour et service. La photo fournie sert de référence de structure et d’effectif ; elle ne suffit pas à affirmer une récurrence de cuisine. Ces horaires ne sont donc pas inventés à l’initialisation.
4. Vérifier les limites communes dans **Règles**. Les valeurs proposées sont des paramètres de prototype, pas une validation des dispositions applicables au restaurant.
5. Ouvrir **Besoins des services**, sélectionner la semaine, ajuster les variantes et enregistrer. Les besoins proposés au départ sont à valider, pas une transcription exacte de la photo.
6. Enregistrer éventuellement un modèle A, B ou un autre nom. Les modèles mémorisent les besoins ; les disponibilités appartiennent aux semaines datées.
7. Préparer les semaines suivantes puis utiliser le rappel interne depuis **Planning**.

L’initialisation reprend les prénoms visibles sur le planning de référence. Tous les contrats sont proposés à **35 h**, faute de volumes individuels communiqués ; ils doivent être corrigés avant de générer. Seul Jean-Sébastien possède initialement les compétences d’ouverture, de fermeture et les clés. Les autres habilitations sont à renseigner, sans les déduire du prénom ou des horaires figurant sur la photo.

### Chaque employé

Depuis **Équipe**, le responsable peut ouvrir **Voir les dispos**, à côté de **Gérer la fiche**. Une fenêtre en lecture seule présente les variantes midi/soir, les quatre états de disponibilité, les préférences et la confirmation pour la semaine choisie. Les habitudes héritées et les données préremplies pour les tests sont distinguées des confirmations personnelles. Le changement de semaine dans cette fenêtre ne modifie pas la semaine du planning et n’enregistre aucune donnée. Pour la cuisine, **Voir les horaires** affiche les shifts fixes récurrents. La fenêtre se ferme avec son bouton ou Échap, garde le focus clavier et s’adapte au mobile.

1. Choisir son nom et entrer son PIN.
2. Ouvrir **Mes disponibilités**, sélectionner une semaine.
3. Renseigner les variantes accessibles avec ses compétences. `10:00–15:30` et `11:00–15:30` sont deux choix indépendants, mais des alternatives dans le même service.
4. Choisir ses préférences de semaine. Les niveaux sont « sans préférence », « souhait léger » et « souhait fort ».
5. Sauvegarder un brouillon ou confirmer la semaine.
6. Consulter le planning personnel ou collectif après publication, ainsi que son fil de notifications.

États : **à confirmer**, **disponible**, **de préférence non**, **indisponible**. Une absence de réponse n’est jamais assimilée à une disponibilité. La confirmation demande une réponse sur toutes les variantes accessibles, ou l’option « disponible pour les autres shifts ».

L’option de disponibilité générale ne remplace pas les exceptions déjà renseignées. Ajouter une indisponibilité la décoche ; les autres disponibilités ainsi complétées sont conservées explicitement. Toute modification enregistrée en brouillon retire la confirmation précédente. Une nouvelle confirmation prévient le responsable.

« Utiliser ces choix comme réglages habituels » enregistre les disponibilités récurrentes et les préférences pour les semaines encore non renseignées. Une semaine ayant ses propres valeurs reste indépendante. Un changement local n’écrase pas les habitudes sans cette option. Même héritée des habitudes, chaque semaine est à confirmer.

### Génération et publication

La génération porte sur **1 à 6 semaines consécutives**, à partir de la semaine sélectionnée. Elle remplace les affectations non verrouillées des brouillons de cette période. Les affectations verrouillées et les shifts de cuisine sont conservés, même s’ils présentent un conflit ; le responsable doit alors corriger ce conflit.

Jean-Sébastien peut ajouter ou retirer une personne sur un shift, puis verrouiller l’affectation. Les compétences, les chevauchements et les limites de travail sont contrôlés aussi lors d’une affectation manuelle. Une affectation à quelqu’un dont les disponibilités sont non confirmées ou incompatibles apparaît en alerte et bloque la publication.

La publication est explicite, semaine par semaine. Les postes non couverts, indisponibilités fermes, réponses inconnues et autres conflits bloquants doivent être corrigés. Les compromis sur les préférences restent des avertissements. Une notification interne est créée pour chaque membre actif lors de la publication ou republication.

Modifier un brouillon après publication ne change pas ce que les employés voient : la dernière version publiée est conservée jusqu’à la prochaine publication. Copier une semaine ou appliquer un modèle remplace ses besoins et ses affectations de brouillon, puis retire les confirmations. Les anciens choix de disponibilité sont conservés lorsqu’ils correspondent toujours aux mêmes variantes.

## Calcul des heures

- Pause repas déduite : **30 minutes par employé et par service**.
- Deux services le même jour : deux pauses, soit 60 minutes.
- Midi en semaine : fin prévisionnelle à **15 h 30**.
- Soir du dimanche au jeudi : fin prévisionnelle à **23 h**.
- Vendredi et samedi soir : fin prévisionnelle à **minuit**.
- Les variantes du week-end en journée sont configurées dans les besoins.
- Un shift qui finit à `00:00` se termine le lendemain. Sa durée tient compte du passage de minuit.
- Les totaux sont rattachés au jour de début du shift ; les fractions après minuit ne sont pas déplacées dans un autre mois.

Exemples : `10:00–15:30` = 5 h nettes ; `11:00–15:30` = 4 h ; `18:30–23:00` = 4 h ; `18:30–00:00` = 5 h.

Objectif de génération : **contrat hebdomadaire × nombre de semaines sélectionnées**. Objectif du tableau mensuel : **contrat hebdomadaire × nombre de jours calendaires du mois ÷ 7**. Le prorata est un repère de planification du prototype, pas un calcul de paie ou une annualisation contractuelle. Le tableau distingue brouillons et publications et signale les semaines manquantes. Les valeurs sont arrondies à la minute uniquement à l’affichage.

Le carnet physique conserve les heures réelles. Aucun pointage ni calcul de salaire n’est introduit.

## Fonctionnement du générateur

Implémentation indépendante des vues HTTP : `backend/lulu/domain.py`.

1. Retirer les affectations automatiques non verrouillées dans la période.
2. Charger les affectations fixes, verrouillées et celles des autres semaines pour contrôler les chevauchements et repos aux frontières de la période.
3. Traiter d’abord les shifts ayant le moins de candidats accessibles relativement à leur effectif.
4. Écarter les comptes inactifs, compétences manquantes, semaines non confirmées, indisponibilités fermes, réponses inconnues, chevauchements, doubles affectations dans un service et dépassements des limites configurées.
5. Donner la priorité aux disponibilités complètes, puis utiliser les « de préférence non » en recours.
6. Comparer les candidats selon leurs heures déjà prévues face au contrat, le souhait de volume hebdomadaire, les coupures, le regroupement, les services midi/soir, les week-ends, la stabilité et les collègues déjà rencontrés.
7. Retourner une proposition avec les postes restants et les compromis détectés.

Il s’agit d’une **heuristique gloutonne déterministe**, pas d’un solveur garantissant la meilleure solution ou la couverture maximale. Un poste restant vide signifie « non couvert par cette proposition », pas « impossible à couvrir ». Les préférences peuvent entrer en conflit ; un souhait fort n’est pas une interdiction. L’objectif de variété utilise les collègues affectés au même jour et au même service.

Limites actuelles : pas de solveur global avec retour arrière, pas de gestion de congés/absences contractuelles pour recalculer l’objectif, pas de qualification juridique des limites, pas d’historique détaillé de chaque modification, pas d’export PDF dédié, pas d’emails ni de notifications push, pas de création multi-restaurants. Le fil est consultable et actualisé à l’ouverture ou après une action ; les rappels sont déclenchés par le responsable.

## Architecture

### Stockage

- `Employee` : identité locale, rôle responsable, activité, heures hebdomadaires, compétences, habitudes et shifts fixes.
- `Session` : empreinte SHA-256 d’un jeton aléatoire, employé et expiration après 12 heures.
- `Board` : singleton du restaurant, document JSON (semaines, modèles, limites, notifications) et numéro de révision.

Le JSON du planning est validé côté serveur. Chaque mutation utilise une transaction et compare la révision du client. Un ancien onglet reçoit HTTP 409 plutôt que d’écraser une modification concurrente. Le frontend conserve alors un message et propose de recharger. Les PIN ne sont jamais inclus dans les réponses de planning : ils sont hachés avec les mécanismes Django. Cinq échecs PIN entraînent un blocage de 15 minutes du compte. Une réinitialisation de PIN ou une désactivation invalide les sessions.

Le document JSON commun est un compromis adapté à un seul restaurant. Une future version modulaire pourra normaliser les semaines, besoins et affectations en tables séparées et limiter les conflits de révision aux seules semaines concernées.

### API

Base : `/api/lulu/`.

| Route                    | Méthode | Accès                                             |
| ------------------------ | ------- | ------------------------------------------------- |
| `people/`                | GET     | Public : liste des identifiants et noms actifs    |
| `login/`                 | POST    | Nom sélectionné (`employeeId`) et `pin`           |
| `logout/`                | POST    | Révoque le jeton fourni                           |
| `board/?week=AAAA-MM-JJ` | GET     | Session Lulu requise, semaine commençant un lundi |
| `board/?week=AAAA-MM-JJ` | POST    | Session requise, action + révision                |

Authentification : `Authorization: Lulu <jeton>`. Le navigateur conserve le jeton uniquement dans `sessionStorage`, séparément des accès ExtraBeam.

Actions employé : `availability`, `read`, `pin`.

Actions responsable : `employee`, `rules`, `shifts`, `saveTemplate`, `applyTemplate`, `copyWeek`, `generate`, `assign`, `publish`, `remind`.

Chaque réponse de planning est adaptée au rôle : un employé reçoit ses propres disponibilités et notifications, les noms/compétences de l’équipe, les besoins et les versions publiées. Les affectations de brouillon, les disponibilités des collègues, leurs contrats et leurs habitudes ne lui sont pas communiqués.

Une semaine demandée en lecture mais encore absente est présentée avec des besoins suggérés. Elle est réellement persistée à la première action. Les variantes suggérées ont des identifiants stables pour permettre une première affectation manuelle dès cette lecture. Le tableau mensuel signale les semaines non encore enregistrées.

### Frontend et animations

`frontend/src/lulu/` contient l’application, les types/helpers et les styles. La route `/lulu/*` est indépendante des routes métier ExtraBeam. Les styles sont limités à `.lulu`.

Les écrans sont séparés dans `frontend/src/lulu/pages/`. `LuluApp.tsx` porte la session, les appels et la navigation, `Login.tsx` la connexion et `ui.tsx` les petits composants partagés. Le module est chargé à la demande pour ne pas ajouter son interface aux autres pages d’ExtraBeam.

La direction visuelle reprend un carnet de maison : papier crème, vert profond, accents terre cuite, titres sérif et cartes par service. Les écrans s’adaptent au mobile ; le planning conserve un défilement horizontal pour préserver la comparaison des sept jours.

Animations : entrée douce des sections, apparition des confirmations, ouverture de fiche, rotation d’entrée du motif, retours au survol et à la pression. Les transformations et l’opacité évitent de déplacer la mise en page. Aucune animation ne tourne indéfiniment. `prefers-reduced-motion: reduce` retire les animations et transitions ; le contenu reste immédiatement accessible. Les champs possèdent des libellés, les contrôles un focus visible et les erreurs des annonces accessibles.

## Installation et accès

Depuis la racine du projet, sous PowerShell :

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd backend
..\.venv\Scripts\python.exe manage.py migrate
..\.venv\Scripts\python.exe manage.py init_lulu
..\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8002
```

Dans un second terminal :

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1
```

Ouvrir `http://127.0.0.1:5180/lulu`. Le frontend utilise la configuration existante `VITE_API_URL` (par défaut `http://127.0.0.1:8002/api`). Utiliser `127.0.0.1` pour correspondre aux origines CORS configurées par défaut.

`init_lulu` affiche un PIN aléatoire de six chiffres par personne **une seule fois**. Conserver ces accès dans un endroit privé et les transmettre individuellement. La commande est idempotente et ne réinitialise jamais des comptes existants. Aucun PIN universel ni compte de démonstration public n’est ajouté. Pour changer un PIN ensuite : fiche employé du responsable, ou écran personnel **Mon accès**.

Sur Linux / Docker, utiliser les commandes Django équivalentes dans l’environnement existant. Les migrations sont incluses ; `init_lulu` reste une étape explicite lors du premier déploiement. Utiliser HTTPS et les réglages de production du projet avant une exposition distante. Cette livraison locale ne publie pas le site.

## Vérification

```powershell
cd backend
..\.venv\Scripts\python.exe manage.py test lulu --noinput
..\.venv\Scripts\python.exe manage.py check
cd ../frontend
npm.cmd run build
```

Les tests couvrent les permissions et la confidentialité, le blocage PIN, l’expiration, les heures nettes, les fins à 23 h/minuit, les confirmations et habitudes, les notifications, les indisponibilités fermes et souples, les chevauchements et plafonds, l’équilibrage, la conservation des shifts fixes et verrous, les publications séparées des brouillons, les modèles et les conflits de révision.

Parcours de recette conseillé : préparer une petite semaine → se connecter comme employé → confirmer ses disponibilités → générer comme responsable → ajuster et verrouiller → consulter les heures → publier → vérifier comme employé → modifier le brouillon et vérifier que l’ancienne publication reste visible → republier et vérifier la notification. Répéter les écrans principaux sur mobile et avec la réduction des animations activée.
