#!/usr/bin/env bash
# Starts all 10 NovaGen backend services natively (no Docker), each in its own
# venv, each as a background process. Run from the repo root:
#   bash deployment/native/start-all.sh
#
# Assumes: PostgreSQL/MongoDB/Neo4j/Redis/MinIO are already running natively
# (see deployment/native/README.md) and .env is in the repo root with
# localhost-based values (deployment/native/.env.native.example).
#
# Logs for each service go to deployment/native/logs/<service>.log.
# PIDs are tracked in deployment/native/logs/<service>.pid so stop-all.sh can
# clean them up.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
LOG_DIR="$REPO_ROOT/deployment/native/logs"
mkdir -p "$LOG_DIR"

if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "No .env found at repo root. Copy deployment/native/.env.native.example to .env first and fill in real passwords."
  exit 1
fi

# service_name:port
SERVICES=(
  "gateway:8000"
  "auth-service:8001"
  "drug-service:8002"
  "prediction-service:8003"
  "analytics-service:8004"
  "experiment-service:8005"
  "report-service:8006"
  "notification-service:8007"
  "workflow-service:8008"
  "automation-service:8009"
)

for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  svc_dir="$BACKEND_DIR/$name"

  echo "=== $name (port $port) ==="

  if [ ! -d "$svc_dir/venv" ]; then
    echo "  creating venv..."
    python3 -m venv "$svc_dir/venv"
  fi

  echo "  installing dependencies (this is slow the first time — RDKit/PyTorch are large)..."
  "$svc_dir/venv/bin/pip" install --quiet --upgrade pip
  "$svc_dir/venv/bin/pip" install --quiet -r "$svc_dir/requirements.txt"

  echo "  starting on :$port..."
  (
    cd "$svc_dir"
    export PYTHONPATH="$BACKEND_DIR"
    set -a
    source "$REPO_ROOT/.env"
    set +a
    nohup "$svc_dir/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port "$port" \
      > "$LOG_DIR/$name.log" 2>&1 &
    echo $! > "$LOG_DIR/$name.pid"
  )
done

echo ""
echo "All services launching. Tail logs with: tail -f deployment/native/logs/*.log"
echo "Check health once they're up:"
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  echo "  curl http://localhost:$port/health   # $name"
done
echo ""
echo "Stop everything with: bash deployment/native/stop-all.sh"
