#!/usr/bin/env bash
# Usage: ./firstDeploy.sh

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

if [[ ! -f .env ]]; then
    echo "Missing .env file. Create it with: cp .env.example .env"
    echo "Then edit .env and replace the example passwords before deploying."
    exit 1
fi

for variable in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DELETE_PASSWORD; do
    if ! grep -Eq "^${variable}=.+$" .env; then
        echo "Missing or empty ${variable} in .env."
        exit 1
    fi
done

# Check Docker separately so a Docker error is not reported as missing Compose.
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed or is not in PATH. Rerun ./installDependencies.sh."
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "The Docker Compose plugin is not available to the Docker CLI."
    echo "Docker executable: $(command -v docker)"
    docker --version || true
    echo "Rerun ./installDependencies.sh, then verify with: docker compose version"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Docker is installed, but the daemon is unavailable or this user lacks permission."
    echo "Log out and SSH back in, then run: docker info"
    exit 1
fi

echo "===== Starting AVA-03 First Deployment ====="
echo "Starting database docker container..."

$COMPOSE up -d db

until $COMPOSE exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; do
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
