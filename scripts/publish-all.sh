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


if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

PARSER_DIR="packages/kql-parser"
DUCKDB_DIR="packages/kql-to-duckdb"

# Get current versions from package.json
PARSER_VERSION=$(grep '"version"' "$PARSER_DIR/package.json" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
DUCKDB_VERSION=$(grep '"version"' "$DUCKDB_DIR/package.json" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')

PARSER_TGZ="fossiq-kql-parser-$PARSER_VERSION.tgz"
DUCKDB_TGZ="fossiq-kql-to-duckdb-$DUCKDB_VERSION.tgz"

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
npm pack --registry https://npm.pkg.github.com @fossiq/kql-parser@$PARSER_VERSION
if [ ! -f "$PARSER_TGZ" ]; then
    echo "❌ Error: Failed to download @fossiq/kql-parser@$PARSER_VERSION"
    exit 1
fi
cd "$OLDPWD"

echo ""
echo "📦 Publishing packages to public NPM registry..."
echo "ℹ️  Registry: https://registry.npmjs.org/"

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

echo "📤 Publishing @fossiq/kql-to-duckdb to NPM..."
if [ -z "$OTP" ]; then
    npm publish --registry https://registry.npmjs.org/ --access public
else
    npm publish --registry https://registry.npmjs.org/ --access public --otp="$OTP"
fi

cd ../..

echo ""
echo "✅ Done! Both packages downloaded from GitHub Packages and republished to NPM:"
echo "   @fossiq/kql-parser@$PARSER_VERSION"
echo "   @fossiq/kql-to-duckdb@$DUCKDB_VERSION"
