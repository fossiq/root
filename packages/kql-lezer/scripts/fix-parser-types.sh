#!/usr/bin/env bash
# Prepends TypeScript/ESLint ignore directives to generated parser files.
# The lezer-generator output has implicit any types we don't need to fix.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSER_FILE="$SCRIPT_DIR/../src/parser.ts"

HEADER='// This is a generated file. Type checking is disabled to simplify maintenance.
// The lezer-generator output has implicit any types that are safe to ignore.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'

# Prepend header to parser.ts
echo "$HEADER" | cat - "$PARSER_FILE" > "$PARSER_FILE.tmp" && mv "$PARSER_FILE.tmp" "$PARSER_FILE"
