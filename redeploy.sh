#!/usr/bin/env bash
# Usage: ./redeploy.sh [--restart-db]

# ===== This script is for re-deploying after changes =====

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

until $COMPOSE exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; do
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
