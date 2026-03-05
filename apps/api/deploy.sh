#!/bin/bash

# Azure App Service deployment script for OmniConvert API

# Exit on error
set -e

echo "Starting deployment..."

# Navigate to workspace root
cd ../..

# Install workspace dependencies
echo "Installing workspace dependencies..."
npm install --workspace=apps/api --workspace=packages/types --workspace=packages/utils

# Navigate to API folder
cd apps/api

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "Deployment complete!"
