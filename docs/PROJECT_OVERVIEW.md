# Fossiq Project Overview

**Last Updated:** 2026-01-19
**For:** AI Agents

## Mission

Browser-first KQL (Kusto Query Language) tool for querying CSV files. No server required - everything runs in the browser using WASM.

## Current State

**Status:** Production-ready for core features
**Version:** All packages at v1.2.0
**Branch:** `feat/move-to-lezer-completely`

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (packages/ui - SolidJS + Vite)     │
│  ┌────────────┐  ┌─────────────────────┐   │
│  │ KQL Editor │→ │  Query Execution    │   │
│  │ CodeMirror │  │  kql-to-duckdb     │   │
│  │ + Lezer    │  │  DuckDB WASM       │   │
│  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
         ↓                     ↓
    kql-lezer            kql-to-duckdb
   (Lezer parser)       (AST → SQL)
         ↓                     ↓
      kql-ast (shared types)
```

## Packages

| Package | Purpose | Status | Tests |
|---------|---------|--------|-------|
| `@fossiq/kql-lezer` | Lezer parser for KQL syntax highlighting in CodeMirror | ✅ Production | Failing (dep issues) |
| `@fossiq/kql-to-duckdb` | KQL AST → DuckDB SQL translator | ✅ Production | 113 passing |
| `@fossiq/kql-ast` | Shared AST type definitions | 🔄 Initial | None yet |
| `@fossiq/ui` | Browser-based query interface | ✅ Production | Manual testing |
| `@fossiq/lezer-grammar-generator` | TypeScript → Lezer grammar generator | ✅ Complete | Well covered |

## Key Features

### Completed ✅
- **Parser:** Lezer-based KQL parser with full operator support
- **Translator:** 11 core operators, 8 join types, 35+ functions
- **UI:** CodeMirror editor, DuckDB WASM execution, results table, file persistence
- **Developer Tools:** Grammar generator for Lezer

### Pending ⏳
- Fix kql-lezer test dependencies (@lezer/lr resolution)
- Improve syntax highlighting color vibrancy
- Complete kql-ast implementation

## KQL Support

**Operators (11):** where, project (+ 4 variants), extend, summarize, sort, distinct, take/limit, top, union, mv-expand, search
**Joins (8):** inner, left/right/full outer, left/right anti, left/right semi
**Functions (35+):** String, math, datetime, type conversion
**Expressions:** Arithmetic, comparison, logical, string operators, between, in

## Known Limitations

- **Parse operator:** Not supported (architectural constraint - dynamic schema incompatible with SQL)
- **Tree-sitter parser:** Removed in favor of Lezer-only approach
- **Subqueries:** Not yet implemented

## Development Status by Phase

**kql-lezer:** Phase 4 complete (CodeMirror integration)
**kql-to-duckdb:** Phase 14 complete (all planned operators)
**kql-ast:** Phase 1 (types defined, not yet integrated)
**ui:** Phase 7 (polishing)
**lezer-grammar-generator:** Feature complete

## Quick Start

```bash
# Install and run
bun install
cd packages/ui && bun run dev

# Visit http://localhost:5173
```

## Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [PACKAGES.md](./PACKAGES.md) - Package-specific documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow and gotchas
- [../AGENTS.md](../AGENTS.md) - AI agent instructions (CRITICAL: read first)
