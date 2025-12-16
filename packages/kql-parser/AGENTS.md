# @fossiq/kql-parser Agent Guide

## Purpose
- Tree-sitter-based KQL parser with typed AST builders and multi-platform bindings consumed by `@fossiq/kql-to-duckdb`, `@fossiq/ui`, CLI tooling.
- Keep grammar, builders, and types in sync—changes usually span all three layers.

## Structure Overview
```
packages/kql-parser/
├── src/grammar/*        # TS grammar + compiler
├── src/builders/*       # SyntaxNode -> typed AST
├── src/types.ts         # AST definitions
├── scripts/*.ts         # build-grammar/binding/wasm helpers
├── prebuilds/*          # native bindings per platform
├── tree-sitter-kql.wasm # committed WASM
└── tests/*              # 88 grammar suites
```

## Commands
- Install workspace deps: `bun install` (repo root).
- Grammar compile: `bun run compile-grammar` (TS → grammar.js).
- Tree-sitter generate + TypeScript build: `bun run generate` (wraps tree-sitter CLI) and `bun run build` (tsc + bindings).
- Native binding build: `bun run build:binding` (current platform).
- WASM build (rare, CI usually): `bun run build:wasm`.
- Tests: `bun run test` (bun test tests/).

## Workflow Checklist
1. Edit grammar (`src/grammar/rules.ts`, register in `src/grammar/index.ts`).
2. Update types (`src/types.ts`) for new nodes.
3. Update builders (`src/builders/*`). Handle wrapper nodes (`operator`, `expression`, `literal`) before switching.
4. Run `bun run compile-grammar && bun run generate`.
5. Rebuild/test: `bun run build && bun run test`.
6. Commit generated assets (`grammar.js`, parser.c, prebuilds, wasm) if they changed.

## Style & Patterns
- Functional TypeScript; keep files under ~150 lines.
- Skip punctuation nodes when iterating (e.g., commas in lists).
- Use discriminated unions for AST nodes and ensure optional fields for backwards compatibility.
- Keep builder helpers focused (one node type per function).

## Status (2025-12-09)
- Tests: 88 passing grammar suites.
- Scope: 14 core operators (where/project/extend/summarize/sort/take/top/distinct/count/search/join/union/parse/mv-expand) plus let statements.
- Known gaps: advanced operators (find, sample, mv-apply, make-series, evaluate, range) and advanced literals (verbatim strings, multi-line, obfuscated, shorthand timespans).

## Documentation & Coordination
- Development guide: `packages/kql-parser/docs/kql-parser-dev.md`
- Status & checklist: `packages/kql-parser/docs/kql-parser-status.md`
- Coordinate AST changes with translator + UI teams so they can add expression/operator support immediately.
- Note CI artifacts (prebuilds/WASM) when regeneration is required.
