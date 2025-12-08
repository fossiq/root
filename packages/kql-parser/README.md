# @fossiq/kql-parser

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
import { parse, createParser } from '@fossiq/kql-parser';
import KQL from '@fossiq/kql-parser/grammar';

// Parse a KQL query
const ast = parse(KQL, 'Users | where age > 18 | project name, email');

// Or create a reusable parser instance
const parser = createParser(KQL);
const ast = parser.parse('Users | summarize count() by country');

console.log(ast);
```

## Supported Features

### Query Operators (14)
- ✅ `where` - Filter rows
- ✅ `project` - Select columns
- ✅ `extend` - Add computed columns
- ✅ `summarize` - Aggregate with grouping
- ✅ `join` - Table joins (all join kinds)
- ✅ `union` - Combine tables
- ✅ `parse` - Extract from strings
- ✅ `mv-expand` - Expand multi-value fields
- ✅ `sort` / `order by` - Sort results
- ✅ `take` / `limit` - Limit rows
- ✅ `top` - Top N rows
- ✅ `distinct` - Unique values
- ✅ `count` - Count rows
- ✅ `search` - Full-text search

### Expressions
- ✅ Binary operators (`and`, `or`)
- ✅ Comparison operators (`==`, `!=`, `>`, `<`, `>=`, `<=`)
- ✅ Arithmetic operators (`+`, `-`, `*`, `/`, `%`)
- ✅ String operators (`contains`, `startswith`, `endswith`, `matches`, `has`)
- ✅ `in` operator
- ✅ `between` operator
- ✅ Conditional expressions (`iff`, `case`)
- ✅ Type casting (`::` and `to type()`)
- ✅ Function calls with positional and named arguments
- ✅ Parenthesized expressions

### Literals
- ✅ Strings (`"..."`, `'...'`)
- ✅ Numbers (int, float)
- ✅ Booleans (`true`, `false`)
- ✅ Null (`null`)
- ✅ TimeSpans (`1d`, `2h`, `30m`, `500ms`)
- ✅ Arrays (`[1, 2, 3]`, nested, empty)
- ✅ Dynamic/JSON objects (`dynamic()`)

### Advanced Features
- ✅ Let statements - Variable declarations
- ✅ Column prefixes - Qualified identifiers (`Table.Column`)
- ✅ Function named arguments

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
  type: 'source_file';
  statements: Statement[];
}

interface QueryStatement {
  type: 'query_statement';
  table: Identifier;
  pipes: PipeExpression[];
}

interface WhereClause {
  type: 'where_clause';
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
} from '@fossiq/kql-parser';
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
bun run test-grammar

# Build for distribution
bun run build
```

## Scripts

- `compile-grammar` - Compile TypeScript grammar to JavaScript
- `generate` - Run compile-grammar + tree-sitter generate
- `build` - Full build (generate + TypeScript compilation)
- `test-grammar` - Run grammar tests
- `prepublishOnly` - Pre-publish checks (build + tests)

## Architecture

The parser is built in three layers:

1. **Grammar** (`src/grammar/`) - Tree-sitter grammar rules in TypeScript
2. **Types** (`src/types.ts`) - TypeScript AST type definitions
3. **Builders** (`src/builders/`) - Convert tree-sitter nodes to typed AST

See `.copilot/kql-parser/architecture.md` for detailed documentation.

## Testing

The parser includes 89 comprehensive tests covering real-world KQL queries:

```bash
bun run test-grammar
```

All tests validate that queries parse without errors using the tree-sitter CLI.

## Status

**98% feature complete** - The parser handles the vast majority of real-world KQL queries.

See `.copilot/kql-parser/status.md` for detailed feature checklist.

## License

MIT

## Contributing

Contributions welcome! Please see the implementation guide at `.copilot/kql-parser/implementation-guide.md` for details on adding new features.
