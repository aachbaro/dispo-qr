# Frontend v2

Frontend React + TypeScript + Vite pour ExtraBeam v2.

## Ce qui est en place

- page de connexion ExtraBeam
- page d'inscription ExtraBeam
- callback OIDC `/auth/callback`
- bouton principal de compte partage `pascuans`
- bouton Google avec flow `auth-code`
- formulaire email / mot de passe
- page `/profile` de debug
- contexte utilisateur en memoire
- switch mock / backend via `VITE_USE_MOCK_API`

## Setup local

### Linux

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Ou depuis `extrabeam/v2/`:

```bash
./start-dev.sh
```

### Windows

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

App disponible sur `http://127.0.0.1:5180`.

## Mode prod

Le frontend est maintenant integre au compose `extrabeam/v2/docker-compose.yml`.

Fichiers utiles:

- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `../.env.example`

## Variables d'environnement

```env
VITE_GOOGLE_CLIENT_ID=
VITE_API_URL=http://127.0.0.1:8002/api
VITE_USE_MOCK_API=false
VITE_AUTH_SERVER_URL=http://127.0.0.1:8001
VITE_SHOW_LOCAL_DEBUG_AUTH=true
```

`VITE_GOOGLE_CLIENT_ID` doit venir du meme client OAuth Google que celui configure dans le backend.

`VITE_AUTH_SERVER_URL` doit pointer vers le `auth-server` central si tu veux partager le meme compte que `fragment`.

## Modes de test

### Backend local

Laisse `VITE_USE_MOCK_API=false` et lance aussi le backend v2.

Pour le compte partage:

- lance aussi `auth-server`
- configure `VITE_AUTH_SERVER_URL`
- configure `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` dans `backend/.env`
- clique sur `Continuer avec le compte pascuans` depuis `/login`

Pour Google en vrai:

- renseigne `VITE_GOOGLE_CLIENT_ID`
- ajoute `http://127.0.0.1:5180` et `http://localhost:5180` dans les `Authorized JavaScript origins` du client OAuth Google
- lance le frontend sur ce meme port
- le front enverra ensuite le `code` au backend via `/api/auth/google/`

### Mock front uniquement

Passe:

```env
VITE_USE_MOCK_API=true
```

Puis teste:

- le bouton principal de compte partage est a ignorer en mock pur
- email libre + mot de passe `test`
- bouton Google

## Pages

- `/login`
- `/register`
- `/auth/callback`
- `/profile`
- `/forgot-password` redirige vers le reset central `auth-server`
