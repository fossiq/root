# @fossiq/lezer-grammar-generator

## 2.0.2

### Patch Changes

- @fossiq/kql-ast@2.0.2

## 2.0.1

### Patch Changes

- 973d950: Resolve TypeScript lint warnings

  - Fixed type guards in `type-guards.ts`
  - Improved type safety in `generator/main.ts`

- Updated dependencies
  - @fossiq/kql-ast@2.0.1

## 2.0.0

### Patch Changes

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

- Updated dependencies [22df9d8]
  - @fossiq/kql-ast@2.0.0
