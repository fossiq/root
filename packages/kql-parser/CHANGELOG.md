# @fossiq/kql-parser

## 1.1.4

## 1.1.3

### Patch Changes

- CI: deploy key for UI deployment trigger

## 1.1.2

### Patch Changes

- CI: use bun publish for package publishing

## 1.1.1

### Patch Changes

- CI improvements: turborepo for builds, WASI SDK for WASM, node_modules caching
- cc43114: Fix CI test script to handle packages without test files

  - Updated test-packages.sh to check if test files exist before running bun test
  - Prevents CI failures for packages like kql-ast that have test scripts but no test files

## 1.0.3

### Patch Changes

- Fix test scripts to handle coverage flags properly
- Add test:coverage script for coverage reporting
- Ensure tree-sitter WASM availability in test environment
- Remove unnecessary WASM build step from CI workflow

## 1.0.2

### Patch Changes

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

## 1.0.1

### Patch Changes

- feat: inckuding all bindings in one

## 1.0.0

### Major Changes

- chore: bump version for CI publish test

## 0.1.13

### Patch Changes

- Feat: including binaries for all platforms

## 0.1.9

### Patch Changes

- ea8976b: chore: debugging CI/CD

## 0.1.8

### Patch Changes

- 7fae64c: Test OIDC publishing without NPM_TOKEN

## 0.1.7

### Patch Changes

- 70e53b8: Test trusted publishing with npm v11+

## 0.1.6

### Patch Changes

- 3680620: Enable NPM trusted publishing with provenance

## 0.1.5

### Patch Changes

- fc0f59b: Fix .npmrc location for proper npm authentication during publish

## 0.1.4

### Patch Changes

- aac7899: Fix npm authentication in CI/CD workflow

## 0.1.3

### Patch Changes

- e0a9c47: Improve CI/CD workflow with caching and script extraction

## 0.1.2

### Patch Changes

- f43980f: Feat: integrating changesets
