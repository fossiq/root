# @fossiq/kql-lezer

Lezer-based KQL parser for CodeMirror with syntax highlighting and AST generation.

Pure JavaScript parser with no WASM dependencies, using the Lezer incremental parser generator. Designed for real-time syntax highlighting and editor integration.

## Features

### Real-time Syntax Highlighting
- CodeMirror 6 language support
- Incremental parsing for performance
- Semantic token types (keywords, operators, literals, comments)

### Full KQL Grammar Support

**Query Structure**
- Let statements for variable binding
- Pipeline expressions with table sources
- Bracketed identifiers (`['column name']`)

**Operators**
- `where` - filtering with logical/comparison expressions
- `project` - column selection with aliases and expressions
- `project-away`, `project-keep`, `project-rename`, `project-reorder`
- `extend` - add computed columns
- `sort`/`order` - with `asc`/`desc` and `nulls first`/`last`
- `limit`, `take` - result limiting
- `top` - top N by expression
- `distinct` - distinct columns
- `summarize` - aggregations with `by` clause
- `join` - all 8 KQL join types
- `union` - combine tables
- `mv-expand` - multi-value expansion
- `search`, `find` - text search
- Plus: `parse`, `make-series`, `range`, `as`, `evaluate`, `render`, `partition`, `sample`, `serialize`

**Expressions**
- Logical operators: `and`, `or`, `not`
- Comparison operators: `==`, `!=`, `>`, `>=`, `<`, `<=`
- String operators: `contains`, `startswith`, `endswith`, `has`, `matches`, `regex` (with negations and case-sensitive variants)
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- `between` operator for ranges
- Parenthesized expressions
- Unary operators: `-`, `not`

**Literals**
- Numbers (integer and decimal)
- Strings (regular, verbatim `@"..."`, obfuscated `h"..."`)
- Booleans: `true`, `false`
- Null: `null`
- Timespan literals: `1d`, `30m`, `12h`, `500ms`, `1d12h30m`
- DateTime literals: `datetime(2024-01-20)`
- GUID literals: `guid(xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`

**Comments**
- Line comments (`// comment`)

### Complete AST Generation

Converts Lezer's CST (Concrete Syntax Tree) to a typed AST compatible with `@fossiq/kql-ast`. Includes:
- Full operator support
- Expression trees
- Type preservation
- Position tracking
- Error recovery

### Test Coverage

**110 tests passing** covering:
- All operators and operator combinations
- Expression parsing
- Literal types
- Comments and whitespace
- Edge cases and error conditions

## Installation

```bash
bun add @fossiq/kql-lezer
```

## Usage

### Parsing

```typescript
import { parseKQL } from "@fossiq/kql-lezer";

const result = parseKQL("Events | where Level == 'Error' | take 10");

console.log(result.ast);      // Typed AST (Query object)
console.log(result.errors);   // Parse errors (if any)
console.log(result.tokens);   // Highlight tokens for syntax coloring
```

### CodeMirror Integration

```typescript
import { EditorView, basicSetup } from "codemirror";
import { kql } from "@fossiq/kql-lezer";

const editor = new EditorView({
  extensions: [
    basicSetup,
    kql(), // KQL language support with syntax highlighting
  ],
  parent: document.body,
});
```

### Syntax Highlighting Only

```typescript
import { extractHighlightTokens } from "@fossiq/kql-lezer";

const tokens = extractHighlightTokens("Events | where Level == 'Error'");
// Returns array of { type, start, end, value } tokens
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) v1.0+

### Commands

```bash
# Build parser from grammar
bun run build:grammar

# Compile TypeScript
bun run build

# Run tests
bun test

# Run tests with coverage
bun run test:coverage
```

### Grammar Development

The grammar is defined in `src/kql.grammar` using Lezer syntax. After modifying:

1. Run `bun run build:grammar` to generate `src/parser.ts`
2. Update CST-to-AST mappings in `src/parser/cst-to-ast/` if needed
3. Run tests to verify: `bun test`

### Project Structure

```
src/
├── kql.grammar           # Lezer grammar definition
├── parser.ts             # Generated parser (don't edit directly)
├── index.ts              # Public API
├── errors.ts             # Error detection
├── highlight.ts          # Token extraction for highlighting
└── parser/
    └── cst-to-ast/       # CST to AST conversion
        ├── index.ts      # Main converter
        ├── query/        # Query-level constructs
        ├── operators/    # Operator converters
        ├── expressions/  # Expression converters
        └── tabular/      # Tabular operators
```

## Architecture

### Two-Stage Parsing

1. **Lezer Parser** → CST (Concrete Syntax Tree)
   - Incremental parsing
   - Error recovery
   - Position tracking

2. **CST-to-AST Converter** → AST (Abstract Syntax Tree)
   - Typed structure (`@fossiq/kql-ast`)
   - Simplified for consumers
   - Compatible with translator

### Why Lezer?

- **Pure JavaScript**: No WASM, smaller bundle, instant startup
- **Incremental**: Only re-parses changed regions
- **CodeMirror 6 Native**: Designed for editor integration
- **Maintainable**: Grammar is declarative and readable

## Limitations

### Not Supported

Source-modifying commands are out of scope:
- `.create`, `.alter`, `.drop` table/function definitions
- `.update`, `.rename` operations
- In-place data modifications

This parser targets read/query-only scenarios.

## Contributing

See [CLAUDE.md](../../CLAUDE.md) for development guidelines.

## License

MIT
