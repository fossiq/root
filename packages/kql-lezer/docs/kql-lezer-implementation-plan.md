# KQL Lezer Implementation Plan

This document outlines the roadmap for completing the `@fossiq/kql-lezer` package to support full KQL parsing and valid AST generation.

## Phase 1: Robust Tokenization & Literals

Fixing foundational token gaps to ensure correct parsing of real-world queries.

- [x] **Timespan Literals**
  - Support shorthand syntax (e.g., `1d`, `30m`, `1h30m`)
  - Support `timespan(value)` syntax
- [/] **Complex String Literals** (Partial)
  - [x] Standard single/double quoted strings
  - [x] Verbatim strings (`@"path\to\file"`, `@'text'`) - _Supported (no multiline / embedded quote support yet)_
  - [ ] Multi-line strings - _Deferred_
  - [x] Obfuscated strings (`h"secret"`, `h@"verbatim secret"`) - _Supported_
- [x] **DateTime Literals**
  - Ensure `datetime(...)` is handled correctly (either as literal or function call)
- [x] **GUID/UUID Literals**
  - Support `guid(...)` format

### Technical Note: Regex Escaping Challenges

We encountered significant friction generating complex Lezer regex patterns (specifically for verbatim strings) via TypeScript. The interaction between TypeScript template literal escaping, `lezer-grammar-generator` string handling, and Lezer's own regex syntax causes "Unexpected character" errors for backslashes in character classes (e.g., `!["\\\n]`). A `p` tag helper was introduced to `lezer-grammar-generator` to mitigate this, and the current implementation avoids backslash-heavy character classes to keep patterns robust.

## Phase 2: Critical Operators (SQL Mapping)

Implementing operators essential for standard SQL translation.

- [x] **Range Operators**
  - `between` operator
    - Supports `between (min .. max)` and `!between (min .. max)`
- [/] **Search & Find** (Partial)
  - [x] `search` operator
  - [x] `find` operator
- [x] **Set Operators**
  - `union` - includes `kind=...` and `withsource=...`

## Phase 3: Advanced Language Constructs

Supporting KQL-specific features with complex parsing rules.

- [/] **Array Expansion** (Partial)
  - [x] `mv-expand` (basic column list)
  - `mv-apply` (handling subquery syntax)
- [ ] **Pattern Matching**
  - `parse` operator (simple, regex, and relaxed modes)
- [ ] **Time Series**
  - `make-series` operator
- [ ] **Plugins**
  - `evaluate` operator (bag_unpack, pivot, etc.)
- [ ] **Let Statement Enhancements**
  - Function definitions (`let f=(x) { ... }`)
  - View definitions (`let view x = ...`)

## Phase 4: AST Generation

Bridging the Lezer CST to the shared KQL AST for downstream tools.

- [ ] **Infrastructure**
  - Implement `toParsedAST` in `src/index.ts` (currently a stub)
  - Create CST walker/mapper utility
- [ ] **Node Mapping**
  - Map Statement nodes (`Let`, `TabularExpression`)
  - Map Operator nodes (`Where`, `Project`, `Summarize`, etc.) to `kql-ast` interfaces
  - Map Expression nodes (Binary, Unary, FunctionCalls, Literals)
- [ ] **Validation**
  - Verify output against `kql-ast` type definitions
  - Unit tests comparing input KQL to expected AST structure

## Phase 5: Testing & Refinement

- [ ] **Coverage**: Add tests for all new operators and literal types.
- [ ] **Compatibility**: Ensure parity with `kql-parser` where possible for the shared subset.
