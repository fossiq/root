#!/bin/bash
# Organizes binding artifacts downloaded from GitHub Actions
# Renames binding-<platform>-<arch>/ to <platform>-<arch>/

set -e

cd packages/kql-parser/prebuilds

for dir in binding-*; do
  target="${dir#binding-}"
  mkdir -p "$target"
  mv "$dir"/* "$target/"
  rmdir "$dir"
done

echo "Organized prebuilds:"
ls -R
