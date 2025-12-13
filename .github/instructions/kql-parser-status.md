# KQL Parser Status

## Current State

- **Tests:** 88 passing E2E grammar validation tests
- **Grammar:** Compiles without conflicts  
- **Runtime:** tree-sitter + TypeScript
- **Package:** `@fossiq/kql-parser` ready for publish
- **Literals:** Basic datetime and timespan support via functions
- **Scope:** Core tabular/query features (14 operators) implemented; advanced operators from the KQL implementation guide (find, sample, project-*, mv-apply, make-series, evaluate, range, etc.) are not yet supported

## Test Structure

- `tests/` - Grammar validation using tree-sitter CLI
  - `grammar.test.ts` - Basic smoke tests
  - `operators.test.ts` - All KQL operators
  - `expressions.test.ts` - Expressions, functions, literals, let statements
  - `comments.test.ts` - Line and block comments
  - `_helpers.ts` - Shared parseWithTreeSitter helper
  - `tsconfig.json` - Test-specific TypeScript configuration
- Scripts: `test`, `test:watch`, `lint`, `lint:fix`
- Linting: ESLint configured to prevent `bun:test` imports in `src/` folder

## Recent Completions

**Datetime and Timespan Literals**

- Added `DatetimeLiteral` type for datetime values in ISO 8601 format
- Added `TimespanLiteral` type for timespan values (1d, 2h, 30m, 500ms, etc.)
- Implemented `buildDatetimeLiteral()` and `buildTimespanLiteral()` builders
- Updated `buildAST()` to handle new literal types
- Added comprehensive tests for datetime formats and timespan durations
- Supports: `datetime()`, `now()`, `ago()` functions with proper literal building
- Total tests: 88 passing

**Bun Compatibility & Upgrade**

- Upgraded `tree-sitter` to `^0.25.0` to match CLI version
- Implemented native binding build script (`scripts/build-binding.ts`) for Bun support
- Configured `build` script to auto-generate prebuilds in `prebuilds/<platform>-<arch>/`
- Updated `src/builders/index.ts` to handle wrapper nodes (`operator`, `expression`, `literal`) introduced by newer tree-sitter
- Verified integration with `kql-to-duckdb` package

**Parse operator pattern improvements**

- Grammar: Enhanced `parse_pattern` to support embedded column names
- Added support for column type annotations (`:string`, `:int`, etc.)
- Added support for wildcards (`*`) in patterns for skipping content
- Added support for regex flags parameter
- Pattern syntax: `"literal" columnName:type "separator" anotherColumn:type`
- Added 4 new tests for column extraction, multiple columns, wildcards, and flags
- Total tests: 83

**Comments**

- Grammar: `line_comment`, `block_comment` added to extras
- Supports `//` line comments (single line)
- Supports `/* */` block comments (multi-line)
- Comments can appear anywhere in the query (inline, between operators, at start/end)
- Added 8 tests covering all comment scenarios

**Edge cases: Column prefixes + Type casting + Dynamic literals**

- Types: `QualifiedIdentifier`, `TypeCastExpression`, `DynamicLiteral`
- Grammar: `qualified_identifier`, `type_cast_expression`, `dynamic_literal`
- Builders: `buildQualifiedIdentifier()`, `buildTypeCastExpression()`, `buildDynamicLiteral()`
- Column prefixes: `Table.Column` syntax for qualified identifiers
- Type casting: Both `::` and `to type()` syntax
- Dynamic: `dynamic()` wrapper for JSON-like values
- Added 7 tests

**Let statements + Conditional expressions + Named arguments**

- Types: `LetStatement`, `ConditionalExpression`, `NamedArgument`, `FunctionCall`
- Grammar: `let_statement`, `conditional_expression`, `argument`, `named_argument`
- Builders: `buildLetStatement()`, `buildConditionalExpression()`, `buildFunctionCall()`, `buildNamedArgument()`
- Let: Variable declarations with scalar values (`let x = 10;`)
- Conditionals: `iff()` ternary and `case()` multi-branch expressions
- Named args: Functions support mixed positional and named arguments
- Added 10 tests

**MV-expand operator**

- Types: `MvExpandClause`
- Grammar: `mv_expand_clause`
- Builders: `buildMvExpandClause()`
- Supports both `mv-expand` and `mvexpand` syntax, optional `to typeof()`, optional limit
- Added 4 tests

**Parse operator**

- Types: `ParseClause`, `ParseKind`
- Grammar: `parse_clause`, `parse_kind`
- Builders: `buildParseClause()`
- Supports parse kinds (simple, regex, relaxed), source expression, pattern string
- Added 3 tests (simplified - full pattern parsing deferred)
- Note: Complex patterns with embedded column names require additional grammar work

**Union operator**

- Types: `UnionClause`, `UnionKind`
- Grammar: `union_clause`, `union_kind`, `table_list`
- Builders: `buildUnionClause()`
- Supports union kinds (inner, outer), isfuzzy parameter, multiple tables
- Added 6 tests

**Join operator**

- Types: `JoinClause`, `JoinCondition`, `JoinKind`
- Grammar: `join_clause`, `join_kind`, `join_conditions`, `join_condition`
- Builders: `buildJoinClause()`, `buildJoinCondition()`
- Supports all join kinds (inner, leftouter, rightouter, leftanti, rightanti, leftsemi, rightsemi, fullouter)
- Supports simple column conditions and $left/$right prefixed conditions
- Added 7 tests

## Feature Checklist

### Core

- [x] Pipe operator (`|`)
- [x] Table references
- [x] Query statements

### Operators

**Supported:**

- [x] `where` - Filter rows
- [x] `project` - Select columns  
- [x] `extend` - Add computed columns
- [x] `summarize` - Aggregate with grouping
- [x] `sort` / `order by` - Sort results
- [x] `take` / `limit` - Limit rows
- [x] `top` - Top N rows
- [x] `distinct` - Unique values
- [x] `count` - Count rows
- [x] `search` - Full-text search
- [x] `join` - Table joins
- [x] `union` - Combine tables
- [x] `parse` - Extract from strings with column names
- [x] `mv-expand` - Expand multi-value
- [x] `let` - Basic variable declarations

**Pending:**

- [ ] `find` - Search across tables
- [ ] `sample` - Random sampling
- [ ] `project-away` - Exclude columns
- [ ] `project-keep` - Keep only specified columns
- [ ] `project-rename` - Rename columns
- [ ] `project-reorder` - Reorder columns
- [ ] `mv-apply` - Apply subqueries to expanded arrays
- [ ] `make-series` - Time series generation
- [ ] `evaluate` - Plugin operations (bag_unpack, pivot, etc.)
- [ ] `range` - Number sequence generation

### Expressions

**Supported:**

- [x] Binary (`and`, `or`)
- [x] Comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`)
- [x] Arithmetic (`+`, `-`, `*`, `/`, `%`)
- [x] String (`contains`, `startswith`, `endswith`, `matches`, `has`)
- [x] `in` operator
- [x] `between` operator
- [x] Parenthesized expressions
- [x] Function calls (positional and named args)
- [x] Conditional (`iff`, `case`)
- [x] Type casting (`::` and `to type()`)

**Pending:**

- [ ] Case-sensitive string variants (`contains_cs`, `startswith_cs`, etc.)
- [ ] Negated operators (`!between`, `!contains`, etc.)
- [ ] Case-insensitive `in` (`in~`)

### Literals

**Supported:**

- [x] Basic strings (`"..."`, `'...'`)
- [x] Number (int, float)
- [x] Boolean (`true`, `false`)
- [x] Null (`null`)
- [x] TimeSpan via functions (`timespan()`)
- [x] Array (`[1, 2, 3]`, nested, empty)
- [x] Dynamic/JSON objects (`dynamic()`)

**Pending:**

- [ ] Verbatim strings (`@"..."`, `@'...'`)
- [ ] Multi-line strings (triple backticks)
- [ ] Obfuscated strings (`h"..."`)
- [ ] Timespan shorthand combinations (`1d2h30m`)

### Advanced

- [x] Column prefix (`Table.Column`)
- [x] Comments (`//` line, `/* */` block)
- [x] Parse patterns (embedded column names, type annotations, wildcards)
- [x] Datetime literals (ISO 8601 format)
- [x] Timespan literals (1d, 2h, 30m, 500ms)
- [ ] Subqueries (complex, optional)

## Known Gaps vs Implementation Guide

The parser intentionally targets the subset consumed by `@fossiq/kql-to-duckdb`, while the KQL implementation guide represents a broader superset. Key gaps include:

**Operators:**
- Advanced project variants (`project-away`, `project-keep`, `project-rename`, `project-reorder`)
- Sampling (`find`, `sample`)
- Time series (`make-series`)
- Plugin operations (`evaluate`)
- Array operations (`mv-apply`, `range`)

**Expressions:**
- Case-sensitive string variants (`contains_cs`, `startswith_cs`, etc.)
- Negated operators (`!between`, `!contains`)
- Case-insensitive `in` (`in~`)

**Literals:**
- Verbatim strings (`@"..."`, `@'...'`)
- Multi-line strings (triple backticks)
- Obfuscated strings (`h"..."`)
- Timespan shorthand combinations (`1d2h30m`)

**Advanced Features:**
- `materialize()` caching
- `toscalar()` conversion
- Tabular `let` functions
- Strict whitespace enforcement for `let`/`set`

## Summary

**Core tabular functionality complete!**

The parser implements the essential KQL operators needed for query transformation:

- 14 core operators (where, project, extend, summarize, join, union, parse, mv-expand, sort, take, limit, distinct, count, top, search)
- Basic expressions (binary, comparison, arithmetic, string, in, between, conditional)
- Simple let statements and function calls
- Basic literals (strings, numbers, arrays, dynamic objects)
- Column prefixes and type casting
- Comments (line and block)
- Parse patterns with column extraction
- Datetime/timespan via functions
- 88 comprehensive tests covering real-world queries

**The parser is production-ready for its intended scope!** It handles all queries needed by `@fossiq/kql-to-duckdb` while maintaining a clear path for future expansion to support the full KQL surface area.

## Publishing Readiness

**Status: Ready for npm publish**

- All TypeScript errors fixed
- Build script: `npm run build`
- Prepublish script: Runs build + tests
- Package metadata complete
- Proper exports configured
- E2E test coverage for all grammar features
- Package scope changed to `@fossiq/kql-parser`
- Repository updated to `git@github.com:fossiq/root.git`

### Package Scripts

- `compile-grammar` - Compile TS grammar -> JS
- `generate` - Compile grammar + tree-sitter generate
- `build` - Full build (generate + tsc)
- `prebuild` - Runs generate before build
- `prepublishOnly` - Full build + tests before publish
- `test` - Run E2E tests
- `test:watch` - Run tests in watch mode

### Publishing

```bash
cd packages/kql-parser
npm publish
```
