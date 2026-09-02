#!/usr/bin/env bash
# Usage: ./installDependencies.sh

set -euo pipefail

echo "===== Installing dependencies for AVA-03 ====="

TARGET_USER="${SUDO_USER:-$(id -un)}"
SWAP_FILE="/swapfile"

sudo apt-get update
sudo apt-get install -y curl git docker.io docker-compose-v2

# Add 2 GiB of disk-backed memory. Creating the file is skipped on later runs.
if [[ ! -f "$SWAP_FILE" ]]; then
    sudo fallocate -L 2G "$SWAP_FILE"
    sudo chmod 600 "$SWAP_FILE"
    sudo mkswap "$SWAP_FILE"
fi

if ! sudo swapon --show=NAME --noheadings | grep -Fxq "$SWAP_FILE"; then
    sudo swapon "$SWAP_FILE"
fi

if ! sudo grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$TARGET_USER"
sudo docker compose version
free -h

echo "Dependencies installed. Log out and SSH back in before running ./firstDeploy.sh."
