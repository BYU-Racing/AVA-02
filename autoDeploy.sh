#!/usr/bin/env bash
set -euo pipefail

echo "Pulling latest code from git repository..."
git pull

echo "Running Frontend build via Vite"
cd Frontend/ava-03
npm ci
NODE_OPTIONS=--max_old_space_size=2048 npm run build
cd ../..

echo "Restarting docker container"
docker compose up -d --build

echo "Deployment complete!"