#!/bin/bash
set -e

# This script works around the issue where tree-sitter-cli needs to load
# grammar.js as a CommonJS module, but package.json has "type": "module"
# which causes Node.js to treat all .js files as ESM.

cd "$(dirname "$0")/.."

# Compile the grammar (produces grammar.js with CommonJS syntax)
bun run compile-grammar

# Temporarily remove "type": "module" so Node.js treats grammar.js as CommonJS
# This is needed for tree-sitter-cli to load it
echo "Temporarily adjusting package.json for tree-sitter compatibility..."
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json')); delete pkg.type; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"

# Run tree-sitter generate
echo "Generating parser..."
bun x tree-sitter-cli generate

# Restore "type": "module"
echo "Restoring package.json..."
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json')); pkg.type='module'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"

echo "✓ Parser generation complete"
