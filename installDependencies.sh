#!/usr/bin/env bash
# Usage: ./installDependencies.sh

# ===== This script should be run first, before any other scripts =====
# --After it is run, make sure to log out and ssh back in

set -euo pipefail

echo "===== Installing Dependencies for AVA-03 ====="

sudo yum update -y
sudo yum install -y docker git
sudo systemctl enable --now docker
sudo usermod -a -G docker ec2-user

sudo mkdir -p /usr/local/lib/docker/cli-plugins

sudo curl -SL \
  https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose

sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Dependencies installed. Please log out and ssh back in to apply Docker permissions."