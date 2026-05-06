#!/usr/bin/env bash
# Usage: ./firstDeploy.sh

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

echo "===== Starting AVA-03 First Deployment ====="
echo "Starting database docker container..."

docker compose up -d db

until docker compose exec -T db pg_isready -U evangelion -d appdb; do
    echo "Waiting for database..."
    sleep 2
done

echo "Database ready. Starting website docker container..."

docker compose up -d --build web
docker compose ps

until curl -fsS http://localhost:8000/api/health | grep -q 'status.*healthy'; do
    echo "Waiting for website to be healthy..."
    sleep 2
done

echo "AVA-03 Website is up! Deployment successful."