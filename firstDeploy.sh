#!/usr/bin/env bash
# Usage: ./firstDeploy.sh

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

# Check if docker compose is plug or standalone
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "Docker Compose is not installed."
    exit 1
fi

echo "===== Starting AVA-03 First Deployment ====="
echo "Starting database docker container..."

$COMPOSE up -d db

until $COMPOSE exec -T db pg_isready -U evangelion -d appdb; do
    echo "Waiting for database..."
    sleep 2
done

echo "Database ready. Starting website docker container..."

$COMPOSE up -d --build web
$COMPOSE ps

until curl -fsS http://localhost:8000/api/health | grep -q 'status.*healthy'; do
    echo "Waiting for website to be healthy..."
    sleep 2
done

echo "AVA-03 Website is up! Deployment successful."