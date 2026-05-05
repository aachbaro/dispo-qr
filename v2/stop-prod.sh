#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for ExtraBeam v2 production mode." >&2
  exit 1
fi

docker compose down

echo "ExtraBeam v2 production stack stopped."
