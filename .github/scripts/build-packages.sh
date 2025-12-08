#!/usr/bin/env bash
set -e

# Build all public packages in the monorepo
for package in packages/*; do
  if [ -f "$package/package.json" ] && [ -f "$package/tsconfig.json" ]; then
    # Skip private packages
    if grep -q '"private".*:.*true' "$package/package.json"; then
      echo "Skipping private package $package"
      continue
    fi
    echo "Building $package..."
    cd "$package"
    if grep -q '"build"' package.json; then
      bun run build
    fi
    cd ../..
  fi
done
