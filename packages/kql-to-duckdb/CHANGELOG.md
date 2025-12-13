# @fossiq/kql-to-duckdb

## 1.2.0

### Patch Changes

- 68972fa: chore: single version publish for all
- 7835e44: feat: improved kql feature completion in the parsers.
- 2d72f16: chore: version bump for CI
- Updated dependencies [49dc3c6]
- Updated dependencies [68972fa]
- Updated dependencies [7835e44]
- Updated dependencies [2d72f16]
- Updated dependencies [2d72f16]
- Updated dependencies [1cc2e1e]
  - @fossiq/kql-parser@1.2.0

## 1.1.4

### Patch Changes

- @fossiq/kql-parser@1.1.4

## 1.1.3

### Patch Changes

- Updated dependencies
  - @fossiq/kql-parser@1.1.3

## 1.1.2

### Patch Changes

- Updated dependencies
  - @fossiq/kql-parser@1.1.2

## 1.1.1

### Patch Changes

- cc43114: Fix CI test script to handle packages without test files

  - Updated test-packages.sh to check if test files exist before running bun test
  - Prevents CI failures for packages like kql-ast that have test scripts but no test files

- Updated dependencies
- Updated dependencies [cc43114]
  - @fossiq/kql-parser@1.1.1

## 0.2.2

### Patch Changes

- Fix test scripts to handle coverage flags properly
- Add test:coverage script for coverage reporting
- Ensure tree-sitter WASM availability in test environment

## 0.2.1

### Patch Changes

- e09ebfe: Fix TypeScript type errors in translator.ts for strict type checking compliance.

## 0.2.0

### Minor Changes

- 0929b04: Add support for 4 new KQL operators and enhance translator capabilities:

  **New Operators (Phases 11-14):**

  - DateTime functions: `now()` and `ago()` with timespan support
  - Let statements for variable definitions and reuse
  - MV-expand operator for multi-value column expansion
  - Search operator for full-text search across columns

  **Features Added:**

  - 113 passing integration tests (up from 85)
  - 35+ mapped functions supporting string, math, type conversions, and datetime operations
  - Case-insensitive search with LIKE patterns
  - Variable substitution in let statements
  - UNNEST support for array/multi-value expansion
  - Timespan to SQL INTERVAL conversion

  All operators integrate seamlessly into pipelines with proper CTE chaining.

### Patch Changes

- Updated dependencies [0929b04]
  - @fossiq/kql-parser@1.0.2

## 0.1.3

### Patch Changes

- Updated dependencies
  - @fossiq/kql-parser@1.0.1

## 0.1.2

### Patch Changes

- Updated dependencies
  - @fossiq/kql-parser@1.0.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @fossiq/kql-parser@0.1.13
