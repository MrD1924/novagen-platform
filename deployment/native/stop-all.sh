#!/usr/bin/env bash
# Stops all services started by start-all.sh, using the PID files it wrote.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$REPO_ROOT/deployment/native/logs"

if [ ! -d "$LOG_DIR" ]; then
  echo "No logs/ directory found — nothing appears to be running via start-all.sh."
  exit 0
fi

for pidfile in "$LOG_DIR"/*.pid; do
  [ -e "$pidfile" ] || continue
  name="$(basename "$pidfile" .pid)"
  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name (pid $pid)..."
    kill "$pid"
  else
    echo "$name (pid $pid) was not running."
  fi
  rm -f "$pidfile"
done

echo "Done. (PostgreSQL/MongoDB/Neo4j/Redis/MinIO are OS services — stop those separately if needed, e.g. \`brew services stop postgresql@16\`.)"
