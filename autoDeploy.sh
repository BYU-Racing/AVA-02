#!/bin/bash

cd /home/FormulaE/AVA-02/Frontend/ava-02

echo "Starting Build"

npm run build || { echo "Build failed"; exit 1; }

cd ../..

tar -a -c -f ava-02-eb-deploy.zip Dockerfile Backend Frontend/ava-02/build .ebextensions || { echo "Packaging failed"; exit 1; }

echo "Packaging successful"