# @fossiq/ui

## 2.1.0

### Minor Changes

- d981aeb: feat: updated lezer grammar, parser and website styles

### Patch Changes

- Updated dependencies [d981aeb]
  - @fossiq/kql-lezer@2.1.0
  - @fossiq/kql-to-duckdb@2.1.0

## 2.0.2

### Patch Changes

- 973d950: Fix string operators parsing and UI improvements

  - Fixed kql-lezer to correctly parse string operators (contains, startswith, endswith, has) by handling GeneralComparisonOp wrapper nodes
  - Fixed kql-to-duckdb translator to generate correct SQL LIKE patterns with wildcards for string operators
  - Fixed ResultsTable to properly display bigint values as regular numbers
  - Improved CodeMirror autocomplete to show aggregation functions in more contexts (after = and ( operators)

- Updated dependencies [973d950]
  - @fossiq/kql-lezer@2.0.2
  - @fossiq/kql-to-duckdb@2.0.2

## 2.0.1

### Minor Changes

- a2e6fdf: Native-like PWA title bar and header actions
  - Added custom title bar with window controls for PWA standalone mode
  - Implemented theme toggle, fullscreen, and refresh actions in header
  - Updated PWA manifest and service worker for standalone display
  - Enhanced theme CSS for better title bar integration
  - Added TypeScript declarations for PWA display mode detection

### Patch Changes

- 973d950: UI improvements and code organization

  - Updated favicon and app icon to KQL-style design
  - Fixed ResultsTable column rendering
  - Split completion module into `completion-data.ts` and `completion.ts`

- Updated dependencies
  - @fossiq/kql-lezer@2.0.1
  - @fossiq/kql-to-duckdb@2.0.1

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
  - @fossiq/kql-lezer@2.0.0
  - @fossiq/kql-to-duckdb@2.0.0

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
  - @fossiq/kql-lezer@1.2.0
  - @fossiq/kql-parser@1.2.0
  - @fossiq/kql-to-duckdb@1.2.0

## 1.1.4

### Patch Changes

- feat(kql-lezer): overhaul syntax highlighting with better token types
  feat(ui): add semantic validation, error visualization and context-aware autocomplete
- Updated dependencies
  - @fossiq/kql-lezer@1.1.4
  - @fossiq/kql-parser@1.1.4
  - @fossiq/kql-to-duckdb@1.1.4

## 0.2.1

### Patch Changes

- Fix test scripts to handle coverage flags properly
- Add test:coverage script for coverage reporting

## 0.2.0

### Minor Changes

- Initial release of Fossiq UI with KQL editor, DuckDB integration, and results table

### Patch Changes

- Updated dependencies
  - @fossiq/kql-lezer@0.2.0
