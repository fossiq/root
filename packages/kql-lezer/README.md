# @fossiq/kql-lezer

Lezer-based KQL parser for CodeMirror with syntax highlighting support.

This package provides real-time KQL syntax highlighting without WASM dependencies, using the Lezer parser generator. The grammar has been significantly expanded to support most KQL operators and expressions.

## Features

### Supported KQL Features

**Query Structure**

- ✅ Let statements for variable binding
- ✅ Pipeline expressions with table sources
- ✅ Bracketed identifiers (`['column name']`)

**Operators**

- ✅ `where` - filtering with logical/comparison expressions
- ✅ `project` - column selection with aliases and expressions
- ✅ `project-away`, `project-keep`, `project-rename`, `project-reorder`
- ✅ `extend` - add computed columns
- ✅ `sort`/`order` - with `asc`/`desc` and `nulls first`/`last`
- ✅ `limit`, `take` - result limiting
- ✅ `top` - top N by expression
- ✅ `distinct` - distinct columns
- ✅ `summarize` - aggregations with `by` clause
- ✅ `mv-expand` - multi-value expansion
- ✅ `union` - combine tables (partial)
- ⚠️ `search`, `find` - text search (grammar complete, AST mapping partial)

**Expressions**

- ✅ Logical operators: `and`, `or`, `not`
- ✅ Comparison operators: `==`, `!=`, `>`, `>=`, `<`, `<=`
- ✅ String operators: `contains`, `startswith`, `endswith`, `has` (with negations and case-sensitive variants)
- ✅ Arithmetic: `+`, `-`, `*`, `/`, `%`
- ⚠️ `between`, `!between` (grammar complete, AST mapping partial)
- ✅ Parenthesized expressions
- ✅ Unary operators: `-`, `not`

**Literals**

- ✅ Numbers (integer and decimal)
- ✅ Strings (regular, verbatim `@"..."`, obfuscated `h"..."`)
- ✅ Timespan literals: `1d`, `30m`, `12h`, `500ms`
- ⚠️ Combined timespans: `1d12h` (needs token adjustment)
- ✅ Function calls: `datetime()`, `guid()`, `count()`, `sum()`, etc.

**Comments**

- ✅ Line comments (`// comment`)

### Test Coverage

**74 out of 108 tests passing (68.5%)**

The parser handles most common KQL queries including complex chained operations like:

```kql
Users
| where age > 18 and status == "active"
| extend isAdult = age >= 21
| summarize count(), avg(age) by department
| sort by count desc
| limit 10
```

See `docs/wip-ast-types-fix.md` for detailed test results and feature status.

## Installation

```bash
bun install @fossiq/kql-lezer
```

## Usage

```typescript
import { parseKQL, extractHighlightTokens } from "@fossiq/kql-lezer";

// Parse KQL and get AST + tokens
const result = parseKQL("Users | where age > 18");
console.log(result.ast); // AST representation
console.log(result.tokens); // Highlight tokens
console.log(result.errors); // Parse errors

// Just get highlight tokens
const tokens = extractHighlightTokens("Users | where age > 18");
```

## Development

### Build Grammar

```bash
# Regenerate parser from grammar
bun run build:grammar

# Compile TypeScript
bun run build

# Run tests
bun test tests

# Run linter
bun run lint
```

### Grammar Structure

The grammar is defined in `src/kql.grammar` using Lezer grammar syntax:

- `@tokens` - token definitions (literals, keywords, operators)
- `@skip` - whitespace and comment handling
- Grammar rules - expression hierarchy and operator precedence

After modifying the grammar:

1. Run `bun run build:grammar` to generate `src/parser.ts`
2. Update CST-to-AST mappings in `src/parser/cst-to-ast/` if needed
3. Run tests to verify changes

## Known Limitations

### TypeScript Build Issues

The TypeScript build currently fails because `@fossiq/kql-ast` is missing type definitions for newer operators. The runtime tests work fine because the parser is pre-generated. To fix, add missing types to `@fossiq/kql-ast/src/index.ts`:

- `ProjectOperator`, `ExtendOperator`, `SortOperator`, etc.
- `ProjectColumn`, `SortExpression`, `Aggregation`
- `UnionExpression`, `SearchExpression`, `FindExpression`

### Incomplete Features

- **Union/Search/Find**: Grammar complete, CST-to-AST mapping incomplete
- **Between operator**: Range syntax edge cases
- **Combined timespans**: `1d12h` format needs token regex adjustment
- **Guid literals**: Function call parsing issues

### Test Expectations

Some tests may expect invalid KQL syntax (e.g., `Users | Events` without an operator). These need review against official KQL documentation.

## Roadmap

### High Priority

- [ ] Add missing AST types to `@fossiq/kql-ast`
- [ ] Complete CST-to-AST for Union/Search/Find expressions
- [ ] Fix Between operator range parsing
- [ ] Fix combined timespan token regex

### Medium Priority

- [ ] `set` statements
- [ ] Join operators (various kinds)
- [ ] `parse` operator with patterns
- [ ] `make-series` time-series support
- [ ] Subqueries in expressions
- [ ] Full `mv-expand` options (kind, itemindex, parallel)

### Low Priority

- [ ] `evaluate` plugin calls
- [ ] `render` visualization hints
- [ ] `top-nested` operator
- [ ] `materialize`/`toscalar` operators
- [ ] Regex flags and advanced string operators
- [ ] Type conversion functions
- [ ] Full identifier rules (`__`, `$` prefixes)

## Will Not Support

Source-modifying commands are out of scope:

- `.create`, `.alter`, `.drop` table/function definitions
- `.update`, `.rename` operations
- In-place data modifications

This grammar targets read/query-only scenarios for syntax highlighting and basic parsing.

## Contributing

See the main repository [CLAUDE.md](../../CLAUDE.md) for development guidelines.

## License

MIT
