#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_ROOT/Frontend/ava-02"

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version-name>"
  exit 1
fi

ZIP_NAME="ava-02-eb-deploy_${VERSION}.zip"

# Ensure zip exists
command -v zip >/dev/null 2>&1 || {
  echo "zip not found. Install it with: sudo apt update && sudo apt install -y zip"
  exit 1
}

cd "$FRONTEND_DIR"
echo "Building frontend (version: $VERSION)"
GENERATE_SOURCEMAP=false NODE_OPTIONS=--max_old_space_size=4096 npm run build

cd "$PROJECT_ROOT"

# Remove old zip if it exists
rm -f "$ZIP_NAME"

echo "Packaging into $ZIP_NAME"
zip -r "$ZIP_NAME" \
  Dockerfile \
  Backend \
  Frontend/ava-02/build \
  .ebextensions

echo "Packaging successful: $ZIP_NAME"
