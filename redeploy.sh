#!/usr/bin/env bash
# Usage: ./redeploy.sh [--restart-db]

# ===== This script is for re-deploying after changes =====

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "Docker Compose is not installed."
    exit 1
fi

RESTART_DB=false
[[ "${1:-}" == "--restart-db" ]] && RESTART_DB=true

echo "===== Starting AVA-03 re-deployment! ====="

echo "Pulling latest code from git repository..."
git pull

if $RESTART_DB; then
  echo "Restarting db service..."
  $COMPOSE restart db
else
  echo "Making sure db service is running..."
  $COMPOSE up -d db
fi

until $COMPOSE exec -T db pg_isready -U evangelion -d appdb; do
  echo "Waiting for database..."
  sleep 2
done

echo "Building and deploying web service"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
$COMPOSE up -d --no-deps --build web

until curl -fsS http://localhost:8000/api/health | grep -q 'status.*healthy'; do
  echo "Waiting for website to be healthy..."
  sleep 2
done

echo "Deployment complete!"
