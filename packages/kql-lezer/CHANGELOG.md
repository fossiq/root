# @fossiq/kql-lezer

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
