# @fossiq/kql-lezer

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
