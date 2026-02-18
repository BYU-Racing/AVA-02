#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="${BUILD_DIR:-build}"
JOBS="${JOBS:-$(nproc)}"

# CMake configure options (add more -D... here if needed)
CMAKE_ARGS=(
  "-DUSE_TLS=ON"
  "-DUSE_OPEN_SSL=1"
)

RECONFIGURE=0
for arg in "$@"; do
  case "$arg" in
    --reconfigure) RECONFIGURE=1 ;;
    --debug) CMAKE_ARGS+=("-DCMAKE_BUILD_TYPE=Debug") ;;
    --release) CMAKE_ARGS+=("-DCMAKE_BUILD_TYPE=Release") ;;
    *) ;;
  esac
done

mkdir -p "$BUILD_DIR"

if [[ ! -f "$BUILD_DIR/CMakeCache.txt" || "$RECONFIGURE" -eq 1 ]]; then
  echo "[build] Configuring in '$BUILD_DIR'..."
  cmake -S . -B "$BUILD_DIR" "${CMAKE_ARGS[@]}"
else
  echo "[build] Already configured (CMakeCache.txt exists)."
fi

echo "[build] Building with $JOBS jobs..."
cmake --build "$BUILD_DIR" -j "$JOBS"

echo "[build] Done."
