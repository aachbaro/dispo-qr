#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for ExtraBeam v2 production mode." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required for ExtraBeam v2 production mode." >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo "Created extrabeam/v2/.env from .env.example. Review frontend build vars before exposing the stack publicly."
fi

if [[ ! -f "$ROOT_DIR/backend/.env.prod" ]]; then
  cp "$ROOT_DIR/backend/.env.prod.example" "$ROOT_DIR/backend/.env.prod"
  echo "Created extrabeam/v2/backend/.env.prod from .env.prod.example. Review secrets before exposing the stack publicly."
fi

docker compose up --build -d

EXTRABEAM_HTTP_PORT="$(
  awk -F= '/^EXTRABEAM_HTTP_PORT=/{print $2}' "$ROOT_DIR/.env" | tail -n 1
)"
EXTRABEAM_HTTP_PORT="${EXTRABEAM_HTTP_PORT:-8080}"

cat <<EOF
ExtraBeam v2 production stack started.
- Frontend: http://127.0.0.1:${EXTRABEAM_HTTP_PORT}
- Compose file: $ROOT_DIR/docker-compose.yml

Useful commands:
  docker compose ps
  ./stop-prod.sh
EOF
