# @fossiq/kql-ast Agent Guide

## Purpose
- Canonical AST + highlight token definitions that every parser/highlighter implements. Keep everything language-agnostic and minimal.
- Primary consumers: `@fossiq/kql-lezer`, `@fossiq/kql-to-duckdb`, `@fossiq/ui`.

## Structure
```
packages/kql-ast/
├── src/index.ts        # All exported types
├── dist/               # tsc output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Commands
- Install workspace deps once at repo root: `bun install`.
- From `packages/kql-ast/` run `bun run build` (tsc). There are no automated tests yet; rely on type-checking.

## Core Types
- `ASTNode`, `KQLDocument`, `QueryStatement`, `TabularStatement`, `Expression` (binary, unary, function, literal, identifier) and `HighlightToken`.
- `ParseResult` signature:
  ```ts
  interface ParseResult {
    ast?: KQLDocument;
    tokens?: HighlightToken[];
    errors: ParseError[];
  }
  ```
- Token taxonomy: keywords, identifiers (function/table/column), operators, literals, punctuation, comments, invalid.

## Design Principles
1. Language agnostic: never depend on tree-sitter or Lezer specifics.
2. Position tracking on every node (byte `start`/`end`).
3. Extensible via discriminant `type` strings; optional fields preserve backwards compatibility.
4. Minimal surface—only add fields/types when multiple downstream consumers need them.

## Usage Patterns
- Parsers import the types and return `ParseResult`. Example:
  ```ts
  import type { ParseResult } from "@fossiq/kql-ast";
  export function parseKQL(input: string): ParseResult {
    const tree = parser.parse(input);
    return {
      ast: convert(tree),
      tokens: highlight(tree),
      errors: collectErrors(tree)
    };
  }
  ```
- Coordinate any breaking type changes with parser + translator maintainers before merging.

## Status (2025-12-09)
- Phase: Initial setup complete.
- Completed: package scaffold, core AST + token types, parser result interface, dev guide.
- In progress: first build/test pass; documentation examples + serialization utilities still TODO.

## Next Steps & Checklists
- Phase 2 Docs: README examples for parser integrations, API reference.
- Phase 3 Build/Test: compile with tsc, add unit tests, verify type compatibility downstream.
- Phase 4 Integration: wire into kql-parser/kql-lezer + UI once finalized.

## Documentation
- Development guide: `packages/kql-ast/docs/kql-ast-dev.md`
- Status & checklist: `packages/kql-ast/docs/kql-ast-status.md`

## Coordination
- Update this file whenever the exported type surface changes.
- Communicate new node kinds to parser + translator owners so they can add builders/translators before release.
