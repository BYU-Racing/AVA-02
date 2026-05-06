#!/usr/bin/env bash
# Usage: ./installDependencies.sh

# ===== This script should be run first, before any other scripts =====
# --After it is run, make sure to log out and ssh back in

set -euo pipefail

echo "===== Installing Dependencies for AVA-03 ====="

sudo yum update -y
sudo yum install -y docker git curl
sudo systemctl enable --now docker
sudo usermod -a -G docker ec2-user

sudo yum install -y docker-compose-plugin

echo "Dependencies installed. Please log out and ssh back in to apply Docker permissions."