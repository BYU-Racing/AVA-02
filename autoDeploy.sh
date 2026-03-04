#!/usr/bin/env bash
# Usage: ./autoDeploy.sh [--restart-db]
set -euo pipefail

RESTART_DB=false
[[ "${1:-}" == "--restart-db" ]] && RESTART_DB=true

echo "Pulling latest code from git repository..."
git pull

echo "Building and deploying web service"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose up -d --no-deps --build web

if $RESTART_DB; then
  echo "Restarting db service..."
  docker compose restart db
fi

echo "Deployment complete!"