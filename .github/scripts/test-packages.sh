#!/usr/bin/env bash
set -e

# Test all public packages in the monorepo with coverage
for package in packages/*; do
  if [ -f "$package/package.json" ]; then
    # Skip private packages
    if grep -q '"private".*:.*true' "$package/package.json"; then
      echo "Skipping private package $package"
      continue
    fi
    echo "Testing $package with coverage..."
    cd "$package"
    if grep -q '"test"' package.json; then
      bun test --coverage --coverage-reporter=lcov
    fi
    cd ../..
  fi
done
