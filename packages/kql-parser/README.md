# @fossiq/kql-parser

[![npm version](https://img.shields.io/npm/v/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser) [![npm downloads](https://img.shields.io/npm/dm/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser) [![license](https://img.shields.io/npm/l/@fossiq/kql-parser.svg)](https://github.com/fossiq/root/blob/main/packages/kql-parser/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/) [![Runtime](https://img.shields.io/badge/runtime-Bun%20%7C%20Node.js%2022%2B-orange.svg)](https://bun.sh/)

A TypeScript parser for Kusto Query Language (KQL) built with tree-sitter.

## Features

- ✅ **Complete KQL grammar** - Supports all major KQL operators and expressions
- ✅ **Type-safe AST** - Fully typed Abstract Syntax Tree with discriminated unions
- ✅ **88 tests** - Comprehensive test coverage for real-world queries
- ✅ **Tree-sitter based** - Fast, incremental parsing with excellent error recovery
- ✅ **Cross-platform prebuilts** - Includes native bindings for Linux, Windows, and macOS, and WASM for browser environments
- ✅ **Minimal dependencies** - Only requires `tree-sitter` for native environments or `web-tree-sitter` for browsers

## Installation

```bash
npm install @fossiq/kql-parser
# or
bun add @fossiq/kql-parser
```

## Usage

This package provides the KQL grammar and AST builders. To parse a query, you'll need to use either `tree-sitter` (for native environments) or `web-tree-sitter` (for browser/WASM environments) directly.

```typescript
import { buildAST } from "@fossiq/kql-parser";
import Parser from "web-tree-sitter"; // or 'tree-sitter' for native

// For web-tree-sitter (browser/WASM environments)
// Ensure tree-sitter-kql.wasm is available at the specified path
async function parseKqlWeb(query: string) {
  await Parser.init();
  const KqlLanguage = await Parser.Language.load(
    "./node_modules/@fossiq/kql-parser/tree-sitter-kql.wasm"
  ); // Adjust path as needed
  const parser = new Parser();
  parser.setLanguage(KqlLanguage);
  const tree = parser.parse(query);
  return buildAST(tree.rootNode);
}

// For native tree-sitter (Node.js/Bun environments)
// You would typically import the native binding directly
// import KqlLanguageNative from '@fossiq/kql-parser/bindings/node';
// function parseKqlNative(query: string) {
//   const parser = new Parser();
//   parser.setLanguage(KqlLanguageNative);
//   const tree = parser.parse(query);
//   return buildAST(tree.rootNode);
// }

// Example Usage
// const ast = await parseKqlWeb("Users | where age > 18");
// console.log(ast);
```

## Supported Features

**Query Operators:** `where`, `project`, `extend`, `summarize`, `join` (all kinds), `union`, `parse`, `mv-expand`, `sort`/`order by`, `take`/`limit`, `top`, `distinct`, `count`, `search`

**Expressions:** Binary (`and`, `or`), comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`), arithmetic (`+`, `-`, `*`, `/`, `%`), string (`contains`, `startswith`, `endswith`, `matches`, `has`), `in`, `between`, conditionals (`iff`, `case`), type casting, function calls, parenthesized expressions

**Literals:** Strings, numbers, booleans, null, timespans (`1d`, `2h`, `30m`), arrays, dynamic/JSON objects

**Advanced:** Let statements, qualified identifiers (`Table.Column`), named arguments

**Not yet supported:** Subqueries

## Examples

### Basic Filtering and Projection

```typescript
const query = `
  Users
  | where age > 18 and country == "US"
  | project name, email, age
  | take 10
`;
const ast = parse(KQL, query);
```

### Aggregation with Grouping

```typescript
const query = `
  Users
  | summarize total = sum(amount), avg_price = avg(price) by category, country
  | order by total desc
`;
const ast = parse(KQL, query);
```

### Joins

```typescript
const query = `
  Users
  | join kind=inner Orders on $left.id == $right.userId
  | project Users.name, Orders.amount
`;
const ast = parse(KQL, query);
```

### Let Statements

```typescript
const query = `
  let threshold = 100;
  let minDate = datetime("2023-01-01");
  Users
  | where age > threshold and timestamp > minDate
  | summarize count()
`;
const ast = parse(KQL, query);
```

### Conditional Expressions

```typescript
const query = `
  Users
  | extend status = iff(age > 18, "adult", "minor")
  | extend level = case(
      score > 90, "A",
      score > 80, "B",
      score > 70, "C",
      "F"
    )
`;
const ast = parse(KQL, query);
```

## AST Structure

The parser produces a fully-typed AST with discriminated unions:

```typescript
interface SourceFile {
  type: "source_file";
  statements: Statement[];
}

interface QueryStatement {
  type: "query_statement";
  table: Identifier;
  pipes: PipeExpression[];
}

interface WhereClause {
  type: "where_clause";
  expression: Expression;
}

// ... and many more typed nodes
```

All AST node types are exported from the package:

```typescript
import type {
  SourceFile,
  QueryStatement,
  WhereClause,
  ProjectClause,
  Expression,
  // ... etc
} from "@fossiq/kql-parser";
```

## Development

```bash
# Install dependencies
bun install

# Compile grammar
bun run compile-grammar

# Generate tree-sitter parser
bun run generate

# Run tests
bun run test

# Build for distribution
bun run build
```

## Scripts

- `compile-grammar` - Compile TypeScript grammar to JavaScript
- `generate` - Run compile-grammar + tree-sitter generate
- `build` - Full build (generate + TypeScript compilation)
- `test` - Run E2E grammar tests
- `test:watch` - Run tests in watch mode
- `prepublishOnly` - Pre-publish checks (build + tests)

## Architecture

The parser is built in three layers:

1. **Grammar** (`src/grammar/`) - Tree-sitter grammar rules in TypeScript
2. **Types** (`src/types.ts`) - TypeScript AST type definitions
3. **Builders** (`src/builders/`) - Convert tree-sitter nodes to typed AST

See `.github/instructions/kql-parser-dev.md` for detailed documentation.

## Testing

The parser includes 88 E2E tests covering all KQL features:

```bash
bun run test
```

Tests are organized by feature (operators, expressions, comments, etc.) and validate that queries parse without errors using the tree-sitter CLI.

## Status

**98% feature complete** - The parser handles the vast majority of real-world KQL queries.

See [status.md](../../.github/instructions/kql-parser-status.md) for detailed feature checklist.

## TODO (per implementation guide)

- Statements: support `set` commands, let function/view definitions, semicolon/whitespace rules between lets and queries.
- Operators: add `find`, `sample`, project variants (away/keep/rename/reorder), `top-nested`, `union withsource`, `make-series`, `mv-apply`, `evaluate` plugins, `render`, `materialize`/`toscalar`, join `innerunique` and hints, `search kind`, `distinct` wildcards.
- Expressions: unary `not`, case-sensitive string ops (`contains_cs`, `has_cs`), `in~`, regex flags, `!between`, comparisons beyond identifier-vs-literal, subqueries.
- Tokens/literals: quoted identifiers, full string forms (verbatim/backtick/obfuscated), combined timespans, datetime literals, identifier rules for `__`/`$`, richer escapes.
- Functions/types: map built-in function categories, type aliases/conversions, aggregation function coverage.
- Special constructs: fuller `mv-expand` (kind/itemindex/parallel), richer `parse` pattern typing, time-series fill behavior.

## Will not support

- Source-modifying commands (update/alter/drop/rename columns or tables, in-place writes); scope is read/query-only parsing and translation.

## License

MIT

## Development

This package was developed with the assistance of AI models including Claude (Anthropic), Gemini (Google), and Zed AI to accelerate implementation and ensure comprehensive grammar coverage.

## Contributing

Contributions welcome! Please see the development guide at `.github/instructions/kql-parser-dev.md` for details on adding new features.
