# @fossiq/kql-parser

[![npm version](https://img.shields.io/npm/v/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser) [![npm downloads](https://img.shields.io/npm/dm/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser) [![license](https://img.shields.io/npm/l/@fossiq/kql-parser.svg)](https://github.com/fossiq/root/blob/main/packages/kql-parser/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/) [![Runtime](https://img.shields.io/badge/runtime-Bun%20%7C%20Node.js%2022%2B-orange.svg)](https://bun.sh/)

A TypeScript parser for Kusto Query Language (KQL) built with tree-sitter.

## Features

- ✅ **Complete KQL grammar** - Supports all major KQL operators and expressions
- ✅ **Type-safe AST** - Fully typed Abstract Syntax Tree with discriminated unions
- ✅ **89 tests** - Comprehensive test coverage for real-world queries
- ✅ **Tree-sitter based** - Fast, incremental parsing with excellent error recovery
- ✅ **Zero dependencies** - Self-contained parser with minimal runtime footprint

## Installation

```bash
npm install @fossiq/kql-parser
# or
bun add @fossiq/kql-parser
```

## Usage

```typescript
import { parse, createParser } from "@fossiq/kql-parser";
import KQL from "@fossiq/kql-parser/grammar";

// Parse a KQL query
const ast = parse(KQL, "Users | where age > 18 | project name, email");

// Or create a reusable parser instance
const parser = createParser(KQL);
const ast = parser.parse("Users | summarize count() by country");

console.log(ast);
```

## Supported Features

**Query Operators:** `where`, `project`, `extend`, `summarize`, `join` (all kinds), `union`, `parse`, `mv-expand`, `sort`/`order by`, `take`/`limit`, `top`, `distinct`, `count`, `search`

**Expressions:** Binary (`and`, `or`), comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`), arithmetic (`+`, `-`, `*`, `/`, `%`), string (`contains`, `startswith`, `endswith`, `matches`, `has`), `in`, `between`, conditionals (`iff`, `case`), type casting, function calls, parenthesized expressions

**Literals:** Strings, numbers, booleans, null, timespans (`1d`, `2h`, `30m`), arrays, dynamic/JSON objects

**Advanced:** Let statements, qualified identifiers (`Table.Column`), named arguments

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

See `.copilot/kql-parser/architecture.md` for detailed documentation.

## Testing

The parser includes 71 E2E tests covering all KQL features:

```bash
bun run test
```

Tests are organized by feature (operators, expressions, etc.) and validate that queries parse without errors using the tree-sitter CLI.

## Status

**98% feature complete** - The parser handles the vast majority of real-world KQL queries.

See `.copilot/kql-parser/status.md` for detailed feature checklist.

## License

MIT

## Development

This package was developed with the assistance of AI models including Claude (Anthropic), Gemini (Google), and Zed AI to accelerate implementation and ensure comprehensive grammar coverage.

## Contributing

Contributions welcome! Please see the implementation guide at `.copilot/kql-parser/implementation-guide.md` for details on adding new features.
