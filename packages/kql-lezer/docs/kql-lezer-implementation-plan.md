# KQL Lezer Implementation Plan

This document outlines the roadmap for completing the `@fossiq/kql-lezer` package to support full KQL parsing and valid AST generation.

## Phase 1: Robust Tokenization & Literals

Fixing foundational token gaps to ensure correct parsing of real-world queries.

- [x] **Timespan Literals**

  - Support shorthand syntax (e.g., `1d`, `30m`, `1h30m`)

  - Support `timespan(value)` syntax

- [/] **Complex String Literals** (Partial)

  - [x] Standard single/double quoted strings

  - [ ] Verbatim strings (`@"path\to\file"`, `@'text'`) - _Deferred due to escaping complexity_

  - [ ] Multi-line strings - _Deferred_

  - [ ] Obfuscated strings (`h"secret"`) - _Deferred_

- [x] **DateTime Literals**

  - Ensure `datetime(...)` is handled correctly (either as literal or function call)

- [x] **GUID/UUID Literals**

  - Support `guid(...)` format

### Technical Note: Regex Escaping Challenges

We encountered significant friction generating complex Lezer regex patterns (specifically for verbatim strings) via TypeScript. The interaction between TypeScript template literal escaping, `lezer-grammar-generator` string handling, and Lezer's own regex syntax causes "Unexpected character" errors for backslashes in character classes (e.g., `!["\\\n]`). A `p` tag helper was introduced to `lezer-grammar-generator` to mitigate this, but complex patterns remain fragile.

## Phase 2: Critical Operators (SQL Mapping)

Implementing operators essential for standard SQL translation.

- [ ] **Range Operators**

  - `between` operator

    - _TODO: Fix `1 .. 10` parsing (precedence/token issue)_

    - _TODO: Implement `!between` (requires dedicated `NotBetween` token)_

- [ ] **Search & Find**

  - `search` operator

  - `find` operator

- [ ] **Set Operators**

  - `union` - _Moved to Deferred/Out of Scope due to specialized token conflicts (identifier vs keyword)_

## Phase 3: Advanced Language Constructs

Supporting KQL-specific features with complex parsing rules.

- [ ] **Array Expansion**
  - `mv-expand` (including typed syntax and properties)
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
