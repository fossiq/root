# @fossiq/kql-lezer

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
