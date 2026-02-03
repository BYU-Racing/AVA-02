#!/bin/bash
set -e

# ---- Config ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" # Get directory where this script lives
PROJECT_ROOT="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_ROOT/Frontend/ava-02"

# ---- Version handling ----
VERSION="$1"

# Version is first argument, exits if not provided
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version-name>"
  echo "Example: $0 b1_0_4"
  exit 1
fi

ZIP_NAME="ava-02-eb-deploy_${VERSION}.zip"

# ---- Build frontend ----
cd "$FRONTEND_DIR"
echo "Starting frontend build (version: $VERSION)"

npm ci || { echo "npm ci failed"; exit 1; }
GENERATE_SOURCEMAP=false NODE_OPTIONS=--max_old_space_size=4096 \
  npm run build || { echo "Build failed"; exit 1; }

# ---- Package for Elastic Beanstalk ----
cd "$PROJECT_ROOT"

echo "Packaging into $ZIP_NAME"

tar -a -c -f "$ZIP_NAME" \
  Dockerfile \
  Backend \
  Frontend/ava-02/build \
  .ebextensions \
  || { echo "Packaging failed"; exit 1; }

echo "Packaging successful: $ZIP_NAME"
