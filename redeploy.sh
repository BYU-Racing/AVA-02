#!/usr/bin/env bash
# Usage: ./redeploy.sh [ec2 | local_live | local] [--restart-db]

# ===== This script is for re-deploying after changes =====

set -euo pipefail
cd "$(dirname "$0")" # in case it's run from another directory

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/scripts/script_helper.sh"

# Checking numbers of params
if (( $# > 2 )); then
    echo "Usage: $0 [ec2 | local_live | local] [--restart-db]"
    exit 1
fi

OPTION="$(validate_option "${1:-local}")" || {
    echo "Usage: $0 [ec2 | local_live | local] [--restart-db]"
    exit 1
}

if [[ "$OPTION" == "ec2" || "$OPTION" == "local_live" ]]; then
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

COMPOSE="$(verify_docker)" || {
    echo "Docker must be running before deploying"
    exit 1
}

RESTART_DB=false
case "${2:-}" in
    "") # 2nd arg is blank
        ;;
    --restart-db) # 2nd arg is --restart-db
        RESTART_DB=true
        ;;
    *) # 2nd arg is something else
        echo "Usage: $0 [ec2 | local_live | local] [--restart-db]" >&2
        exit 1
        ;;
esac


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
