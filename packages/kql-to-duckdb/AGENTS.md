# @fossiq/kql-to-duckdb Agent Guide

## Purpose
- Translate KQL AST into DuckDB SQL using chained CTEs.
- Downstream consumers: `@fossiq/ui`, backend tooling, CLI experiments.

## Structure
```
packages/kql-to-duckdb/
├── src/
│   ├── index.ts        # Public API (kqlToDuckDB, initParser)
│   ├── translator.ts   # Operator + expression translation
│   └── types.ts        # Internal enums/types
├── tests/index.test.ts # 114 translator cases
└── package.json
```

## Commands
- Workspace deps: `bun install` (repo root).
- Build: `bun run build` (tsc).
- Tests: `bun run test` (bun test tests/), `--watch` while iterating.

## Translation Architecture
- Pipeline → CTE chain: each operator becomes `WITH cte_n AS (SELECT ... FROM cte_{n-1})`.
- `translatePipe` dispatches per operator (`where_clause`, `project_clause`, etc.). Keep one helper per operator (`translateSummarizeClause`, `translateJoinClause`, etc.).
- `translateExpression` handles literals, identifiers, arithmetic/comparison/string ops, function calls, `between`, `in`, etc. Add dedicated helpers when new AST node types appear.
- `initParser(wasmPath)` must be called once upstream; do not reinitialize inside translator helpers.

## Status (2025-12-09)
- Operators supported: where, project, extend, summarize, sort, take/limit, top, distinct, join (all kinds), union, mv-expand, search.
- Expression coverage: arithmetic, comparison, string operators (`contains`, `startswith`, `endswith`, `matches`, `has`), `between`, `in`, function calls, type conversions, datetime helpers (`now`, `ago`), let variable substitution.
- Tests: 113+ cases covering every operator/function.

## Development Workflow
1. Add/update AST types in parser first; bump dependency versions together.
2. Extend translator helpers for new operators/expressions and wire switch cases.
3. Update `tests/index.test.ts` with success + regression scenarios.
4. Run `bun run test` to keep suite green before merging.

## Style & Determinism
- Functional TS only; descriptive variable names (`currentRelation`, `cteName`).
- Keep helpers <100 lines and deterministic (stable column ordering, consistent SQL formatting).
- Compose SQL via helper utilities to avoid unwieldy template literals.

## Documentation & Coordination
- Development guide: `packages/kql-to-duckdb/docs/kql-to-duckdb-dev.md`
- Status & checklist: `packages/kql-to-duckdb/docs/kql-to-duckdb-status.md`
- Coordinate translator changes with parser updates so `@fossiq/ui` doesn’t ingest orphaned AST nodes.
