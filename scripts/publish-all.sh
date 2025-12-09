#!/bin/bash
set -e

# Script to download prebuilt bindings from GitHub Actions and publish packages to NPM
# Usage: ./scripts/publish-all.sh

echo "🚀 Starting publish process..."

# Check for required tools
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed."
    exit 1
fi

# Targets to download
TARGETS=("linux-x64" "linux-arm64" "win32-x64" "darwin-arm64")
PARSER_DIR="packages/kql-parser"

echo "🔍 Finding latest 'CI' workflow run..."
# Updated to look for 'CI' workflow since we merged build-bindings into it
RUN_ID=$(gh run list --workflow "ci.yml" --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo "❌ Error: No workflow run found for ci.yml"
    exit 1
fi

echo "✅ Found Workflow Run ID: $RUN_ID"

# Download and place artifacts
for TARGET in "${TARGETS[@]}"; do
    echo "📥 Downloading binding for $TARGET..."
    
    # Define download path
    DEST_DIR="$PARSER_DIR/prebuilds/$TARGET"
    mkdir -p "$DEST_DIR"
    
    # Download artifact
    TMP_DL_DIR=$(mktemp -d)
    
    if gh run download "$RUN_ID" -n "binding-$TARGET" -D "$TMP_DL_DIR"; then
        # Move the file to the correct location
        if [ -f "$TMP_DL_DIR/tree-sitter-kql.node" ]; then
            mv "$TMP_DL_DIR/tree-sitter-kql.node" "$DEST_DIR/"
            echo "   -> Placed in $DEST_DIR/"
        else
            echo "   ⚠️  Warning: tree-sitter-kql.node not found in artifact binding-$TARGET"
            ls -R "$TMP_DL_DIR"
        fi
    else
        echo "   ⚠️  Warning: Failed to download binding-$TARGET. Skipping."
    fi
    
    rm -rf "$TMP_DL_DIR"
done

echo "🎉 All bindings downloaded."

echo "📦 Publishing packages to NPM..."
echo "ℹ️  Note: This script overrides the registry to https://registry.npmjs.org/"

# Publish kql-parser
echo "--- Publishing @fossiq/kql-parser ---"
cd "$PARSER_DIR"
bun publish --registry https://registry.npmjs.org/ --access public
cd ../..

# Publish kql-to-duckdb
echo "--- Publishing @fossiq/kql-to-duckdb ---"
cd "packages/kql-to-duckdb"
bun publish --registry https://registry.npmjs.org/ --access public
cd ../..

echo "✅ Done! Packages published to NPM."
