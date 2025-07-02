#!/bin/bash

# This script fixes package version mismatches after monorepo migration

echo "Fixing package versions..."

# Remove the existing lock file
rm -f pnpm-lock.yaml

# Update all dependencies to their latest compatible versions
cd apps/extension
pnpm update

# Go back to root
cd ../..

# Install all dependencies fresh
pnpm install --no-frozen-lockfile

echo "Package versions fixed!"