#!/usr/bin/env bash
# Usage: ./firstDeploy.sh [ec2 | local_live | local]

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/scripts/script_helper.sh"

# Checking numbers of params
if (( $# > 1 )); then
    echo "Usage: $0 [ec2 | local_live | local]"
    exit 1
fi

OPTION="$(validate_option "${1:-local}")" || {
    echo "Usage: $0 [ec2 | local_live | local]"
    exit 1
}

if [[ "$OPTION" == "local_live" || "$OPTION" == "ec2" ]]; then
    echo "Checking tailscale status..."
    tailscale status >/dev/null 2>&1 || {
        echo "Tailscale is not running. Please run ./installDependencies.sh and log out and back in."
        exit 1
    }
fi

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
COMPOSE="$(verify_docker)" || {
    echo "Docker must be running before deploying"
    exit 1
}

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
