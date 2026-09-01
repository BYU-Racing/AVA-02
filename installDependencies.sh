#!/usr/bin/env bash
# Usage: ./installDependencies.sh

set -euo pipefail

echo "===== Installing dependencies for AVA-03 ====="

TARGET_USER="${SUDO_USER:-$(id -un)}"
SWAP_FILE="/swapfile"
SWAP_SIZE_BYTES=$((2 * 1024 * 1024 * 1024))
MIN_FREE_BYTES=$((SWAP_SIZE_BYTES + 512 * 1024 * 1024))

sudo apt-get update
sudo apt-get install -y ca-certificates curl git

echo "===== Configuring 2 GiB of swap ====="

if sudo swapon --show=NAME --noheadings | grep -Fxq "$SWAP_FILE"; then
    echo "$SWAP_FILE is already active."
elif [[ -e "$SWAP_FILE" ]]; then
    # Never overwrite an existing file. Activate it if it is already valid swap.
    sudo chmod 600 "$SWAP_FILE"
    if ! sudo swapon "$SWAP_FILE"; then
        echo "Error: $SWAP_FILE exists but is not a valid swap file." >&2
        echo "Move or remove it manually, then rerun this installer." >&2
        exit 1
    fi
else
    AVAILABLE_BYTES="$(df -B1 --output=avail / | tail -n 1 | tr -d ' ')"
    if ((AVAILABLE_BYTES < MIN_FREE_BYTES)); then
        echo "Error: at least 2.5 GiB of free disk space is required to create swap." >&2
        df -h /
        exit 1
    fi

    sudo fallocate -l 2G "$SWAP_FILE"
    sudo chmod 600 "$SWAP_FILE"
    sudo mkswap "$SWAP_FILE"
    sudo swapon "$SWAP_FILE"
fi

if ! sudo grep -Eq '^[[:space:]]*/swapfile[[:space:]]' /etc/fstab; then
    sudo cp /etc/fstab /etc/fstab.backup-ava
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

free -h

# Remove the architecture-specific Compose binary created by the old installer.
# It otherwise takes precedence over the plugin installed through apt below.
sudo rm -f /usr/local/lib/docker/cli-plugins/docker-compose

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt-get update
sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

sudo systemctl enable --now docker
sudo usermod -aG docker "$TARGET_USER"
sudo docker compose version

echo "Dependencies installed. Log out and SSH back in before running ./firstDeploy.sh."
