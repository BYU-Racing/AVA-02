#!/bin/bash

cd /home/FormulaE/AVA-02/Frontend/ava-02

echo "Starting Build"

npm run build || { echo "Build failed"; exit 1; }

sudo rm -rf /var/www/build

mkdir -p /var/www/build

cp -r /home/FormulaE/AVA-02/Frontend/ava-02/build/* /var/www/build

sudo systemctl restart nginx

echo "Deploy successful"