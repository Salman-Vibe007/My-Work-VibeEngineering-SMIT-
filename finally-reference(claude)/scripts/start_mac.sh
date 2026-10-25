#!/usr/bin/env bash
# Idempotent start script (macOS/Linux). Usage: ./scripts/start_mac.sh [--build]
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Missing .env - copy .env.example to .env first"; exit 1; }
if [[ "${1:-}" == "--build" ]] || ! docker image inspect finally >/dev/null 2>&1; then
  docker build -t finally .
fi
docker rm -f finally >/dev/null 2>&1 || true
docker run -d --name finally -v "$(pwd)/db:/app/db" -p 8000:8000 --env-file .env finally >/dev/null
echo "FinAlly is running at http://localhost:8000"
(command -v open >/dev/null && open http://localhost:8000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:8000) || true
