# ExtraBeam v2 — Journal de refactorisation

Migration NestJS/Supabase → Django/PostgreSQL + React 19

---

## Contexte

ExtraBeam est une application de gestion de profil freelance et d'agenda.
La v1 utilisait NestJS (backend) + Supabase (auth + DB) + Vue.js (frontend).
La v2 migre vers le stack commun du monorepo pascuans : Django, PostgreSQL, React + Vite + Tailwind.

---

## Stack v2

| Couche     | Technologie                          |
|------------|--------------------------------------|
| Backend    | Django 5 + Django REST Framework     |
| Auth       | OIDC via auth-server (Authlib/PKCE)  |
| DB         | PostgreSQL (partagée monorepo)       |
| Frontend   | React 19 + Vite + TypeScript         |
| Style      | Tailwind 4 + CSS custom properties   |
| Auth token | `UserApiToken` (opaque, localStorage)|

---

## Avancement

### Backend (`extrabeam/v2/backend/`)

| Fichier                        | État       | Description                                              |
|-------------------------------|------------|----------------------------------------------------------|
| `api/models.py`               | ✅ Fait    | AccountProfile (slug, bio, job_title…), Skill, Slot, Unavailability, UserApiToken |
| `api/serializers.py`          | ✅ Fait    | ProfilePublicSerializer, ProfileUpdateSerializer, SkillSerializer, SlotSerializer, UnavailabilitySerializer |
| `api/views.py`                | ✅ Fait    | ProfileOverviewView, SkillsView, SlotsView, UnavailabilitiesView + détails |
| `api/urls.py`                 | ✅ Fait    | Routes `/profiles/<slug>/`, skills, slots, unavailabilities |
| `api/token_auth.py`           | ✅ Fait    | `ProfileTokenAuthentication` — lecture header `Authorization: Token X` |
| `api/backends.py`             | ✅ Fait    | `PascuansOIDCBackend` avec PKCE (BaseOAuth2PKCE + OpenIdConnectAuth) |
| `api/accounts.py`             | ✅ Fait    | `serialize_profile` inclut le champ `slug`               |
| `config/views.py`             | ✅ Fait    | `social_frontend_bridge` émet `slug` + `token` dans le redirect |
| `config/settings.py`          | ✅ Fait    | `DEFAULT_AUTHENTICATION_CLASSES` → `ProfileTokenAuthentication` |
| `migrations/0003_*`           | ✅ Appliqué| Ajoute bio, slug, Slot, Unavailability, UserApiToken, Skill |
| `migrations/0004_mission`     | ✅ Appliqué| Ajoute le modèle Mission                                     |
| `migrations/0005_slot_mission_fk` | ✅ Appliqué | FK optionnelle Mission sur Slot                         |

### Frontend (`extrabeam/v2/frontend/src/`)

| Fichier                              | État       | Description                                              |
|-------------------------------------|------------|----------------------------------------------------------|
| `types.ts`                          | ✅ Fait    | AuthUser, FreelancerProfile, ProfileOverview, Slot, Unavailability |
| `api.ts`                            | ✅ Fait    | authHeaders, getJson, patchJson, deleteReq + tous les appels API profil/slots |
| `context/UserContext.tsx`           | ✅ Fait    | Persistance localStorage (`eb_user`), clearUser()        |
| `App.tsx`                           | ✅ Fait    | Route `/p/:slug` ajoutée, UserProvider centralisé        |
| `pages/AuthCallbackPage.tsx`        | ✅ Fait    | Lit `slug` + `token` depuis les query params, redirige vers `/p/:slug` |
| `pages/ProfilePage.tsx`             | ✅ Fait    | Redirect vers `/p/:slug` si slug connu                   |
| `pages/FreelancerProfilePage.tsx`   | ✅ Fait    | Page profil : récupère ProfileOverview, affiche ProfileCard + Agenda + Missions |
| `components/ProfileCard.tsx`        | ✅ Fait    | Avatar, infos, skills (chips), mode édition owner        |
| `components/missions/MissionsSection.tsx` | ✅ Fait | Liste missions, filtres statut, compteurs, onMissionsChange |
| `components/missions/MissionCard.tsx`     | ✅ Fait | Statut chip, client, dates, montant, slot_count        |
| `components/missions/MissionForm.tsx`     | ✅ Fait | Formulaire modal création/édition mission              |
| `components/unavailabilities/UnavailabilitySection.tsx` | ✅ Fait | Liste indispos récurrentes/ponctuelles, CRUD |
| `components/unavailabilities/UnavailabilityForm.tsx`    | ✅ Fait | Modal création/édition/suppression indisponibilité  |
| `components/agenda/SlotEditModal.tsx`     | ✅ Fait | Modal édition slot : horaires, titre, mission associée |
| `components/Topbar.tsx`                   | ✅ Fait | Barre de navigation partagée (logo, profil, logout)    |
| `components/agenda/Agenda.tsx`      | ✅ Fait    | Navigation semaine, slots colorés par mission, SlotEditModal, légende missions |
| `components/agenda/AgendaDayColumn.tsx` | ✅ Fait | Drag to create, click slot existant, snap 15min          |
| `components/agenda/AgendaSlot.tsx`  | ✅ Fait    | Couleur par mission, clic → édition, mission_title affiché |
| `components/agenda/AgendaHeader.tsx`| ✅ Fait    | Prev/next semaine, label semaine                         |
| `components/agenda/SlotModal.tsx`   | ✅ Fait    | Création slot : horaires, titre, sélecteur de mission    |
| `components/agenda/SlotEditModal.tsx` | ✅ Fait  | Édition slot existant : horaires, titre, mission, suppression |
| `index.css`                         | ✅ Fait    | Variables CSS + utilities + composants : eb-input, eb-btn-primary, eb-btn-ghost, eb-chip |

---

## Ce qui reste à faire

### Court terme

- [ ] **Tests E2E du flux complet** : login OIDC → callback → profil → création slot
- [ ] **Gestion des unavailabilities en frontend** : l'affichage est fait (AgendaSlot gris), mais la création/suppression d'une unavailability n'a pas d'UI dédiée
- [ ] **Mode public du profil** : vérifier que les boutons owner (×, édition) sont bien masqués quand `mode === "public"`
- [ ] **Page d'erreur / 404** : aucune route catch-all pour les slugs invalides
- [x] **Bug slug null** : triple fix — `models.py save()` ajoute slug à `update_fields`, `accounts.py` force save si slug absent, `config/views.py social_frontend_bridge` force save avant redirect
- [x] **Boucle 404 après login** : FreelancerProfilePage détecte slug cassé → OIDC auto (sessionStorage anti-boucle)
- [x] **Bouton déconnexion** : Topbar partagée sur toutes les pages authentifiées
- [x] **Slots liés aux missions** : FK optionnelle + couleur déterministe par mission_id dans l'agenda
- [x] **Indisponibilités CRUD** : UnavailabilitySection + UnavailabilityForm (create/edit/delete/exception)
- [x] **Slots éditables** : click sur slot → SlotEditModal (modifier titre, horaires, mission associée)

### Moyen terme

- [x] **Section Missions** — modèle Django, API CRUD, MissionsSection + MissionCard + MissionForm, slot_count
- [x] **Section Indisponibilités** — API PATCH/DELETE + exception d'occurrence, UnavailabilitySection + UnavailabilityForm
- [x] **Slot ↔ Mission** — FK optionnelle, sélecteur dans SlotModal + SlotEditModal, couleur dans l'agenda
- [ ] **Section Factures** (placeholder visible dans FreelancerProfilePage) — modèles + UI
- [ ] **Avatar upload** : actuellement `avatar_url` est une URL saisie manuellement
- [ ] **Notifications** : aucun système en place pour les nouvelles réservations

### Infrastructure

- [ ] Dockeriser `extrabeam/v2/backend` (image Python, vars d'env, DB link)
- [ ] Ajouter extrabeam v2 frontend au build Docker (ou Caddy static)
- [ ] Intégrer extrabeam dans le flux Cloudflare Tunnel quand prêt pour prod

---

## Décisions d'architecture notables

**Token opaque plutôt que JWT** : plus simple à révoquer, pas besoin de lib côté client,
stocké en base avec lien 1:1 sur AccountProfile. Regénéré à chaque login.

**PKCE obligatoire** : auth-server impose `StrictCodeChallenge(required=True)`.
Le backend extrabeam utilise `BaseOAuth2PKCE` avant `OpenIdConnectAuth` dans le MRO
pour que `auth_params()` génère le `code_challenge` S256.

**Slug immuable** : généré une seule fois depuis `display_name` avec boucle d'unicité.
Sert d'identifiant public dans les URLs (`/p/<slug>`).

**Agenda 07h–24h** : fenêtre de 17h. Chaque slot est positionné en `top%` / `height%`
calculés depuis cette fenêtre. Snap à 15 minutes au drag.

---

## Références

- Auth server : `auth-server/` — Authlib + PKCE + OIDC Discovery
- Dev launcher : `dev.ps1` à la racine du monorepo (commandes : `auth`, `extrabeam`, `fragment`, `all`, `stop`, `status`)
- Fragment (référence design) : `fragment/` — même stack React + Tailwind
