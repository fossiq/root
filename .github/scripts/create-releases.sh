#!/usr/bin/env bash
set -e

# Create GitHub releases for all published packages
# Expects JSON from changesets action in PUBLISHED_PACKAGES env var

if [ -z "$PUBLISHED_PACKAGES" ]; then
  echo "No packages published"
  exit 0
fi

for package in $(echo "$PUBLISHED_PACKAGES" | jq -r '.[] | @base64'); do
  _jq() {
    echo ${package} | base64 --decode | jq -r ${1}
  }

  PACKAGE_NAME=$(_jq '.name')
  PACKAGE_VERSION=$(_jq '.version')
  PACKAGE_SHORT_NAME=$(echo "$PACKAGE_NAME" | sed 's/@fossiq\///')

  echo "Creating release for $PACKAGE_NAME v$PACKAGE_VERSION"

  gh release create "${PACKAGE_SHORT_NAME}-v${PACKAGE_VERSION}" \
    --title "${PACKAGE_NAME} v${PACKAGE_VERSION}" \
    --notes "Published ${PACKAGE_NAME} version ${PACKAGE_VERSION} to npm.

Install: \`npm install ${PACKAGE_NAME}@${PACKAGE_VERSION}\`

See CHANGELOG.md for details."
done
