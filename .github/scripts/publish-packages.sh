#!/bin/bash
# Publishes changed packages using Turborepo's --affected flag
# Uses turbo to detect which packages changed and only publish those
# Handles 409 Conflict gracefully (package already published)
# Outputs: published=1 if any package was published, published=0 otherwise

set -e

echo "=== Detecting affected packages ==="

# Get list of affected packages (excluding ui which is private)
# Using --dry-run=json to get the list without running the task
AFFECTED_JSON=$(bunx turbo run ci:publish --affected --dry-run=json 2>/dev/null || echo '{"packages":[]}')
AFFECTED_PACKAGES=$(echo "$AFFECTED_JSON" | jq -r '.packages[]' 2>/dev/null | grep -v "^//" | grep -v "^fossiq-monorepo$" | grep -v "ui$" || true)

if [ -z "$AFFECTED_PACKAGES" ]; then
  echo "No packages affected - skipping publish"
  echo "published=0" >> $GITHUB_OUTPUT
  exit 0
fi

echo "Affected packages:"
echo "$AFFECTED_PACKAGES"
echo ""

PUBLISHED=0

for pkg in $AFFECTED_PACKAGES; do
  # Extract package name (e.g., @fossiq/kql-parser -> kql-parser)
  pkg_name=$(echo "$pkg" | sed 's/@fossiq\///')

  echo "=== Publishing @fossiq/$pkg_name ==="
  cd "packages/$pkg_name"

  set +e
  OUTPUT=$(bun publish --ignore-scripts 2>&1)
  EXIT_CODE=$?
  set -e

  echo "$OUTPUT"

  if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ @fossiq/$pkg_name published successfully"
    PUBLISHED=1
  elif echo "$OUTPUT" | grep -q "409 Conflict"; then
    echo "⚠ @fossiq/$pkg_name already published (409 Conflict) - skipping"
  else
    echo "✗ @fossiq/$pkg_name publish failed"
    exit 1
  fi

  cd ../..
done

echo ""
echo "=== Publish Summary ==="
if [ $PUBLISHED -eq 1 ]; then
  echo "At least one package was published"
else
  echo "No packages were published (all already at current version)"
fi

echo "published=$PUBLISHED" >> $GITHUB_OUTPUT
