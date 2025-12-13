#!/bin/bash
set -e

# Script to download prebuilt bindings from GitHub npm registry and publish to public NPM
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

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

PARSER_DIR="packages/kql-parser"
DUCKDB_DIR="packages/kql-to-duckdb"

# Get current versions from package.json
PARSER_VERSION=$(grep '"version"' "$PARSER_DIR/package.json" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
DUCKDB_VERSION=$(grep '"version"' "$DUCKDB_DIR/package.json" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')

echo "📦 Detected versions:"
echo "   kql-parser: $PARSER_VERSION"
echo "   kql-to-duckdb: $DUCKDB_VERSION"

# Create temporary directory for downloads
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo ""
echo "📥 Downloading prebuilt packages from GitHub npm registry..."

# Download kql-parser with prebuilds from GitHub registry
echo "--- Downloading @fossiq/kql-parser@$PARSER_VERSION ---"
cd "$TMP_DIR"
npm pack --registry https://npm.pkg.github.com @fossiq/kql-parser@$PARSER_VERSION 2>/dev/null || {
    echo "⚠️  Warning: Could not download from GitHub registry, using local build"
    echo "   Skipping prebuilt binaries download"
}

if [ -f "fossiq-kql-parser-$PARSER_VERSION.tgz" ]; then
    echo "✅ Downloaded kql-parser package"
    # Extract prebuilds if they exist
    tar -xzf "fossiq-kql-parser-$PARSER_VERSION.tgz"
    if [ -d "package/prebuilds" ]; then
        echo "   📋 Found prebuilds, copying to local directory..."
        cp -r package/prebuilds "$OLDPWD/$PARSER_DIR/" || true
    fi
fi

cd "$OLDPWD"

echo ""
echo "📦 Publishing packages to public NPM registry..."
echo "ℹ️  Registry: https://registry.npmjs.org/"

# Build and test before publishing
echo ""
echo "🔨 Building and testing @fossiq/kql-parser..."
cd "$PARSER_DIR"

# Skip WASM build for NPM publish (use prebuilts from CI)
echo "   Compiling grammar, generating parser, and building TypeScript..."
bun run generate
bun run build:binding || true
bun x tsc

echo "   Running tests..."
bun run test

echo "✅ Tests passed for kql-parser"

# Prompt for OTP if needed
echo ""
read -p "Enter your NPM one-time password (or press Enter to skip): " OTP

echo "📤 Publishing @fossiq/kql-parser to NPM..."
if [ -z "$OTP" ]; then
    npm publish --registry https://registry.npmjs.org/ --access public --ignore-scripts
else
    npm publish --registry https://registry.npmjs.org/ --access public --ignore-scripts --otp="$OTP"
fi

cd ../..

# Publish kql-to-duckdb
echo ""
echo "🔨 Building and testing @fossiq/kql-to-duckdb..."
cd "$DUCKDB_DIR"

echo "   Building TypeScript..."
bun run build

echo "   Running tests..."
bun run test

echo "✅ Tests passed for kql-to-duckdb"

echo "📤 Publishing @fossiq/kql-to-duckdb to NPM..."
if [ -z "$OTP" ]; then
    npm publish --registry https://registry.npmjs.org/ --access public
else
    npm publish --registry https://registry.npmjs.org/ --access public --otp="$OTP"
fi

cd ../..

echo ""
echo "✅ Done! Both packages published to NPM:"
echo "   @fossiq/kql-parser@$PARSER_VERSION"
echo "   @fossiq/kql-to-duckdb@$DUCKDB_VERSION"
