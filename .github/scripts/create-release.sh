#!/bin/bash
# Creates a GitHub release for the current version
# Skips gracefully if release already exists

set -e

VERSION=$(jq -r '.version' packages/kql-parser/package.json)

if gh release view "v$VERSION" &>/dev/null; then
  echo "⚠ Release v$VERSION already exists - skipping"
else
  gh release create "v$VERSION" \
    --title "v$VERSION" \
    --notes "Release v$VERSION - see individual package CHANGELOGs for details"
  echo "✓ Release v$VERSION created"
fi
