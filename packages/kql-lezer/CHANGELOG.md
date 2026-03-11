# @fossiq/kql-lezer

## 2.1.0

### Minor Changes

- d981aeb: feat: updated lezer grammar, parser and website styles

### Patch Changes

- Updated dependencies [d981aeb]
  - @fossiq/kql-ast@2.1.0

## 2.0.2

### Patch Changes

- 973d950: Fix string operators parsing and UI improvements

  - Fixed kql-lezer to correctly parse string operators (contains, startswith, endswith, has) by handling GeneralComparisonOp wrapper nodes
  - Fixed kql-to-duckdb translator to generate correct SQL LIKE patterns with wildcards for string operators
  - Fixed ResultsTable to properly display bigint values as regular numbers
  - Improved CodeMirror autocomplete to show aggregation functions in more contexts (after = and ( operators)
  - @fossiq/kql-ast@2.0.2

## 2.0.1

### Patch Changes

- 973d950: Fix string operators parsing in logical expressions

  - Fixed CST-to-AST mapping for string comparison operators (`contains`, `startswith`, `endswith`, `has`, etc.)
  - Improved handling of negated string operators in logical expression trees

- Updated dependencies
  - @fossiq/kql-ast@2.0.1

## 2.0.0

### Major Changes

- 22df9d8: Complete migration from tree-sitter to Lezer parser

  **Breaking Changes:**

  - Removed tree-sitter WASM dependencies entirely
  - Removed `@fossiq/kql-parser` package (use `@fossiq/kql-lezer` instead)
  - No more `initParser()` - parsing is now synchronous
  - AST format changed: `SourceFile` → `Query`, `*Clause` → `*Operator`

  **New Features:**

  - Pure JavaScript Lezer parser (no WASM required)
  - CodeMirror 6 native integration with `kql()` language support
  - Real-time syntax highlighting and incremental parsing
  - 110 passing tests for comprehensive KQL grammar support
  - Improved build times and reduced bundle size

  **Migration Guide:**

  Before (tree-sitter):

  ```typescript
  import { initParser, parseKQL } from "@fossiq/kql-parser";
  await initParser("/path/to/wasm");
  const ast = parseKQL(query);
  ```

  After (Lezer):

  ```typescript
  import { parseKQL } from "@fossiq/kql-lezer";
  const { ast, errors } = parseKQL(query); // Instant, no WASM
  ```

  **Packages Updated:**

  - `@fossiq/kql-lezer`: Added Lezer dependencies, removed Chevrotain, 110 tests passing
  - `@fossiq/kql-to-duckdb`: Rewrote translator for new AST format, added missing dependencies
  - `@fossiq/kql-ast`: Updated type definitions for Lezer AST
  - `@fossiq/ui`: Removed initParser, uses Lezer directly
  - `@fossiq/lezer-grammar-generator`: Fixed test issues, build improvements

  **CI/CD Improvements:**

  - Simplified workflows (single platform: ubuntu-latest)
  - Removed cross-platform build complexity
  - Faster CI runs (no native binary compilation)
  - Fixed all linting and type errors

### Patch Changes

- Updated dependencies [22df9d8]
  - @fossiq/kql-ast@2.0.0

## Unreleased

### Major Changes

- Comprehensive grammar expansion to support most KQL operators and expressions
  - Added logical operators: `and`, `or`, `not`
  - Added string comparison operators: `contains`, `startswith`, `endswith`, `has` (with negations and case-sensitive variants)
  - Added `between` and `!between` operators
  - Added tabular operators: `project`, `extend`, `sort`/`order`, `limit`, `take`, `top`, `distinct`, `summarize`, `mv-expand`
  - Added query-level operators: `union`, `search`, `find`
  - Added timespan literals (`1d`, `30m`, `12h`, `500ms`)
  - Added function call support for `datetime()`, `guid()`, aggregations, etc.
  - Restructured grammar hierarchy: `KQL -> Query -> QueryExpression -> (Union|Search|Find|Pipeline)`

### Minor Changes

- Updated CST-to-AST mapping for new grammar structure
  - Added mappers for all new tabular operators
  - Added support for logical/comparison expression trees
  - Added function call and timespan literal support
  - Updated to handle KQL -> Query -> QueryExpression hierarchy

### Patch Changes

- Updated syntax highlighting to recognize all new keywords
- Improved error handling in expression parsing
- Fixed undefined node handling in binary operator parsing

### Known Issues

- TypeScript build fails due to missing types in `@fossiq/kql-ast` (runtime works fine)
- Union/Search/Find CST-to-AST mapping incomplete
- Between operator range parsing needs edge case fixes
- Combined timespan forms (`1d12h`) need token regex adjustment

### Test Coverage

- 74 out of 108 tests passing (68.5%)
- Full support for common query patterns with where/project/extend/sort/summarize
- Partial support for union/search/find and between operators

## 1.2.0

### Minor Changes

- 49dc3c6: Support bracketed identifiers with spaces

  Added support for KQL bracketed identifier syntax like `['Table Name']` and `['Column Name']`. This enables parsing queries that reference tables or columns containing spaces.

### Patch Changes

- 68972fa: chore: single version publish for all
- 7835e44: feat: improved kql feature completion in the parsers.
- 2d72f16: chore: version bump for CI
- Updated dependencies [68972fa]
- Updated dependencies [7835e44]
- Updated dependencies [2d72f16]
  - @fossiq/kql-ast@1.2.0

## 1.1.4

### Patch Changes

- feat(kql-lezer): overhaul syntax highlighting with better token types
  feat(ui): add semantic validation, error visualization and context-aware autocomplete
  - @fossiq/kql-ast@1.1.4

## 1.1.3

### Patch Changes

- @fossiq/kql-ast@1.1.3

## 1.1.2

### Patch Changes

- @fossiq/kql-ast@1.1.2

## 1.1.1

### Patch Changes

- cc43114: Fix CI test script to handle packages without test files

  - Updated test-packages.sh to check if test files exist before running bun test
  - Prevents CI failures for packages like kql-ast that have test scripts but no test files

- Updated dependencies [cc43114]
  - @fossiq/kql-ast@1.1.1

## 0.2.1

### Patch Changes

- Fix test scripts to handle coverage flags properly
- Add test:coverage script for coverage reporting
- Switch test runner from Vitest to Bun for better monorepo integration

## 0.2.0

### Minor Changes

- Initial release of KQL Lezer grammar package with CodeMirror integration

### Patch Changes

- Updated dependencies
  - @fossiq/kql-ast@0.2.0
