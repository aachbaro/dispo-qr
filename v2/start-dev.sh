#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
PID_FILE="$STATE_DIR/dev-processes.env"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT=8002
FRONTEND_PORT=5180
KEEP_EXISTING=0
NO_INSTALL=0

export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"

cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage: ./start-dev.sh [--keep-existing] [--no-install]

Starts the ExtraBeam v2 backend and frontend for local development on Linux/macOS.
EOF
}

while (($# > 0)); do
  case "$1" in
    --keep-existing)
      KEEP_EXISTING=1
      ;;
    --no-install)
      NO_INSTALL=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

mkdir -p "$STATE_DIR"

find_python() {
  if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
    echo "$BACKEND_DIR/.venv/bin/python"
    return 0
  fi

  if command -v python3 >/dev/null 2>&1; then
    echo "$(command -v python3)"
    return 0
  fi

  if command -v python >/dev/null 2>&1; then
    echo "$(command -v python)"
    return 0
  fi

  return 1
}

find_npm() {
  if [[ -x "$HOME/.local/node/bin/npm" ]]; then
    echo "$HOME/.local/node/bin/npm"
    return 0
  fi

  if command -v npm >/dev/null 2>&1; then
    echo "$(command -v npm)"
    return 0
  fi

  return 1
}

wait_for_port() {
  local port="$1"
  local timeout="${2:-25}"
  local start_ts
  start_ts="$(date +%s)"

  while true; do
    if python3 - "$port" <<'PY' >/dev/null 2>&1
import socket
import sys

sock = socket.socket()
sock.settimeout(0.2)
result = sock.connect_ex(("127.0.0.1", int(sys.argv[1])))
sock.close()
raise SystemExit(0 if result == 0 else 1)
PY
    then
      return 0
    fi

    if (( "$(date +%s)" - start_ts >= timeout )); then
      return 1
    fi

    sleep 0.3
  done
}

launch_detached() {
  local log_path="$1"
  shift

  if command -v setsid >/dev/null 2>&1; then
    setsid "$@" >"$log_path" 2>&1 < /dev/null &
  else
    nohup "$@" >"$log_path" 2>&1 < /dev/null &
  fi

  echo $!
}

boot_backend() {
  local python_cmd="$1"

  if [[ ! -x "$BACKEND_DIR/.venv/bin/python" ]]; then
    if ! "$python_cmd" -m venv "$BACKEND_DIR/.venv" >/dev/null 2>&1; then
      if "$python_cmd" -m virtualenv "$BACKEND_DIR/.venv" >/dev/null 2>&1; then
        :
      else
        cat >&2 <<'EOF'
Unable to create backend virtualenv.
Install python3-venv with sudo, or install virtualenv in user space first:
  python3 -m pip install --user virtualenv
EOF
        exit 1
      fi
    fi
  fi

  local venv_python="$BACKEND_DIR/.venv/bin/python"

  if [[ "$NO_INSTALL" -eq 0 ]]; then
    if ! "$venv_python" -c "import django" >/dev/null 2>&1; then
      "$venv_python" -m pip install -r "$BACKEND_DIR/requirements.txt"
    fi
  fi
}

boot_frontend() {
  local npm_cmd="$1"

  if [[ "$NO_INSTALL" -eq 0 && ! -d "$FRONTEND_DIR/node_modules" ]]; then
    if [[ -f "$FRONTEND_DIR/package-lock.json" ]]; then
      "$npm_cmd" ci --prefix "$FRONTEND_DIR"
    else
      "$npm_cmd" install --prefix "$FRONTEND_DIR"
    fi
  fi
}

if [[ "$KEEP_EXISTING" -eq 0 ]]; then
  "$ROOT_DIR/stop-dev.sh" --quiet || true
fi

PYTHON_CMD="$(find_python || true)"
if [[ -z "$PYTHON_CMD" ]]; then
  echo "python3 is required to start the ExtraBeam v2 backend." >&2
  exit 1
fi

NPM_CMD="$(find_npm || true)"
if [[ -z "$NPM_CMD" ]]; then
  echo "npm is required to start the ExtraBeam v2 frontend." >&2
  exit 1
fi

boot_backend "$PYTHON_CMD"
boot_frontend "$NPM_CMD"

BACKEND_PYTHON="$BACKEND_DIR/.venv/bin/python"

BACKEND_PID="$(
  launch_detached \
    "$STATE_DIR/backend-dev.log" \
    bash -lc "cd '$BACKEND_DIR' && exec env PYTHONUNBUFFERED=1 '$BACKEND_PYTHON' manage.py runserver '127.0.0.1:${BACKEND_PORT}' --noreload"
)"

FRONTEND_PID="$(
  launch_detached \
    "$STATE_DIR/frontend-dev.log" \
    bash -lc "cd '$ROOT_DIR' && exec '$NPM_CMD' run dev --prefix '$FRONTEND_DIR' -- --host 0.0.0.0 --port '$FRONTEND_PORT'"
)"

cleanup() {
  "$ROOT_DIR/stop-dev.sh" --quiet || true
}

if ! wait_for_port "$BACKEND_PORT" 25; then
  echo "ExtraBeam v2 backend did not become reachable on port ${BACKEND_PORT}." >&2
  cleanup
  exit 1
fi

if ! wait_for_port "$FRONTEND_PORT" 30; then
  echo "ExtraBeam v2 frontend did not become reachable on port ${FRONTEND_PORT}." >&2
  cleanup
  exit 1
fi

cat >"$PID_FILE" <<EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
EOF

cat <<EOF
ExtraBeam v2 dev started.
- Backend:  http://127.0.0.1:${BACKEND_PORT}
- Frontend: http://127.0.0.1:${FRONTEND_PORT}
- Logs:     $STATE_DIR/backend-dev.log, $STATE_DIR/frontend-dev.log

Stop with:
  ./stop-dev.sh
EOF
