#!/usr/bin/env bash
git pull

cd Frontend/ava-02
npm ci
NODE_OPTIONS=--max_old_space_size=2048 npm run build
cd ../..

docker compose up -d --build
