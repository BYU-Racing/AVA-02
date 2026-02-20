#!/usr/bin/env bash
echo "Pulling latest code from git repository..."
git pull

echo "Running build"
cd Frontend/ava-02
npm ci
NODE_OPTIONS=--max_old_space_size=2048 npm run build
cd ../..

echo "Restarting docker container"
docker compose up -d --build
