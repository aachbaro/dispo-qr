#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
PID_FILE="$STATE_DIR/dev-processes.env"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
QUIET=0

while (($# > 0)); do
  case "$1" in
    --quiet)
      QUIET=1
      ;;
    -h|--help)
      echo "Usage: ./stop-dev.sh [--quiet]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

stopped=()

stop_pid() {
  local pid="$1"
  local label="$2"

  [[ -z "$pid" ]] && return 0
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
    sleep 0.2
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
    stopped+=("$label:$pid")
  fi
}

if [[ -f "$PID_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"
  stop_pid "${FRONTEND_PID:-}" "frontend"
  stop_pid "${BACKEND_PID:-}" "backend"
fi

pkill -f "$BACKEND_DIR/manage.py runserver 127.0.0.1:8002" >/dev/null 2>&1 || true
pkill -f "$FRONTEND_DIR.*vite.*5180" >/dev/null 2>&1 || true

rm -f "$PID_FILE"

if [[ "$QUIET" -eq 0 ]]; then
  if [[ "${#stopped[@]}" -eq 0 ]]; then
    echo "No ExtraBeam v2 dev process was running."
  else
    echo "Stopped ExtraBeam v2 dev processes:"
    for entry in "${stopped[@]}"; do
      echo "- $entry"
    done
  fi
fi
