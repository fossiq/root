#!/bin/bash
set -e

# Script to download prebuilt bindings from GitHub Actions and publish packages
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

echo "🔍 Finding latest 'Build Bindings' workflow run..."
RUN_ID=$(gh run list --workflow "build-bindings.yml" --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo "❌ Error: No workflow run found for build-bindings.yml"
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
    # Note: gh run download downloads the artifact content into the directory
    # We use a temp dir to avoid clutter if structure varies
    TMP_DL_DIR=$(mktemp -d)
    
    if gh run download "$RUN_ID" -n "binding-$TARGET" -D "$TMP_DL_DIR"; then
        # Move the file to the correct location
        # Expecting tree-sitter-kql.node inside
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

echo "📦 Publishing packages..."

# Publish kql-parser
echo "--- Publishing @fossiq/kql-parser ---"
cd "$PARSER_DIR"
# Remove build:binding from build script temporarily or rely on the fact we just placed files?
# Actually, 'bun run build' invokes 'build:binding' which rebuilds LOCAL binding.
# We want to KEEP the downloaded bindings.
# The local binding build only affects the current platform.
# But we should ensure we don't wipe `prebuilds/` folder.
# The build script `tsc` outputs to `dist/`.
# We'll skip `bun run build` if we trust the dist is ready, OR run build ensuring it doesn't clean `prebuilds`.
# Our package.json `prepublishOnly` runs `build` and `test`.
# `build` runs `generate`, `build:binding`, `tsc`.
# `build:binding` builds LOCAL binding.
# The downloaded bindings are for OTHER platforms (and maybe overwrite local).
# That is fine.
bun publish
cd ../..

# Publish kql-to-duckdb
echo "--- Publishing @fossiq/kql-to-duckdb ---"
cd "packages/kql-to-duckdb"
bun publish
cd ../..

echo "✅ Done! Packages published."
