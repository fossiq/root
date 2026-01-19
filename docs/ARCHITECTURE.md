# Fossiq Architecture

**Last Updated:** 2026-01-19

## Design Philosophy

**Browser-First, WASM-Powered**
- No server required - everything runs client-side
- WASM for performance (DuckDB, Lezer parser)
- Progressive enhancement (works offline, file persistence)

## Data Flow

```
CSV File
  ↓
[User imports via File System Access API]
  ↓
DuckDB WASM (in browser)
  ↓
[User writes KQL query in CodeMirror]
  ↓
Lezer Parser (kql-lezer) → AST
  ↓
Translator (kql-to-duckdb) → DuckDB SQL
  ↓
DuckDB WASM executes query
  ↓
Results → TanStack Table (virtualized)
```

## Package Architecture

### kql-lezer (Parser)

**Technology:** Lezer grammar → LRParser
**Purpose:** Real-time syntax highlighting + AST generation

```
src/kql.grammar (Lezer grammar definition)
  ↓
@lezer/generator
  ↓
src/parser.ts (generated LRParser)
  ↓
src/parser/cst-to-ast/ (CST → AST mapping)
  ↓
@fossiq/kql-ast types
```

**Key Files:**
- `src/kql.grammar` - Grammar definition (hand-written)
- `src/parser.ts` - Generated parser (DO NOT EDIT)
- `src/parser/cst-to-ast/index.ts` - Main CST→AST mapper
- `src/index.ts` - Public API (`parseKQL()`)

### kql-to-duckdb (Translator)

**Technology:** AST visitor pattern
**Strategy:** CTE-based pipeline generation

```typescript
// Input KQL
Table | where X > 10 | project Y, Z

// Output SQL
WITH cte_0 AS (
  SELECT * FROM Table WHERE X > 10
),
cte_1 AS (
  SELECT Y, Z FROM cte_0
)
SELECT * FROM cte_1
```

**Key Files:**
- `src/translator.ts` - Main translation logic
- `src/types.ts` - Internal types (imports from kql-lezer)
- `src/index.ts` - Public API (`translateKQL()`)

**Translation Steps:**
1. Parse operators from AST
2. Generate SQL for each operator
3. Chain via CTEs
4. Return final SELECT

### kql-ast (Shared Types)

**Purpose:** Language-agnostic AST types shared between parser implementations
**Status:** Types defined, not yet fully integrated

**Design Principles:**
- No parser-specific dependencies (no Lezer, no tree-sitter)
- Position tracking on all nodes
- Discriminated unions for type safety

### ui (Web Application)

**Stack:** SolidJS + Vite + PicoCSS + CodeMirror 6 + DuckDB WASM

```
┌─────────────────────────────────────────┐
│ Header (logo, title)                    │
├──────────────────┬──────────────────────┤
│                  │                      │
│  Editor          │  Sidebar             │
│  (CodeMirror)    │  - Add Data button   │
│  - KQL query     │  - File list         │
│  - Lezer syntax  │                      │
│    highlighting  │                      │
│                  │                      │
├──────────────────┴──────────────────────┤
│ Results Table (TanStack + Virtual)      │
│ - Column headers                        │
│ - Virtualized rows                      │
│ - Horizontal scroll                     │
└─────────────────────────────────────────┘
```

**Key Components:**
- `src/App.tsx` - Main layout
- `src/components/Editor.tsx` - CodeMirror integration
- `src/components/ResultsTable.tsx` - Virtualized results
- `src/contexts/SchemaContext.tsx` - DuckDB connection management

**State Management:**
- File handles → IndexedDB (persistence)
- Query text → localStorage
- Theme preference → localStorage + DOM classes
- DuckDB connection → SolidJS context

### lezer-grammar-generator

**Purpose:** Generate `.grammar` text files from TypeScript objects
**Use Case:** Type-safe grammar development

```typescript
// Input: TypeScript
const grammar = {
  name: "KQL",
  rules: {
    Expression: ["BinaryExpression", "Literal"],
    // ...
  }
}

// Output: .grammar file
Expression { BinaryExpression | Literal }
```

## Build System

**Monorepo:** Bun workspaces + Turborepo
**Versioning:** Changesets (fixed mode - all packages version together)
**CI/CD:** GitHub Actions

**Build Order (Turborepo manages this):**
1. `kql-ast` (types only)
2. `lezer-grammar-generator` (tooling)
3. `kql-lezer` (depends on kql-ast)
4. `kql-to-duckdb` (depends on kql-lezer via AST types)
5. `ui` (depends on kql-lezer, kql-to-duckdb)

## Key Architectural Decisions

### 1. Lezer over tree-sitter

**Rationale:**
- No WASM binary needed for parser (Lezer is pure JS)
- Better CodeMirror integration (Lezer is from same team)
- Incremental parsing for editor performance
- Easier to distribute (no native bindings)

**Trade-off:** Less mature ecosystem than tree-sitter

### 2. CTE-based SQL Generation

**Rationale:**
- Clean separation between operators
- Easy to debug (each CTE is one KQL operator)
- Composable (operators chain naturally)

**Trade-off:** Verbose SQL output (vs inline WHERE/JOIN)

### 3. DuckDB over SQLite

**Rationale:**
- Better analytics performance
- Native array/JSON support
- INTERVAL/DATE types match KQL semantics
- Growing WASM support

**Trade-off:** Larger WASM binary (~2MB vs ~1MB for SQLite)

### 4. SolidJS over React

**Rationale:**
- True reactivity (no VDOM diffing)
- Smaller bundle size
- Better performance for data-heavy tables

**Trade-off:** Smaller ecosystem, different mental model

## Performance Considerations

**Parser:** Incremental, sub-millisecond for typical queries
**Translator:** Linear in AST size, negligible overhead
**DuckDB:** Columnar storage, SIMD operations, parallel execution
**Table Rendering:** Virtualization (only visible rows in DOM)

## Security Model

**Sandboxed:** All execution in browser WASM sandbox
**File Access:** Explicit user consent via File System Access API
**No Network:** Intentionally offline-first (no data exfiltration)

## Browser Compatibility

**Required:**
- File System Access API (Chrome 86+, Edge 86+)
- WASM (all modern browsers)
- ES2020+ (modules, optional chaining, nullish coalescing)

**Graceful Degradation:**
- File handles lost on page reload if API unavailable
- Falls back to localStorage for query persistence
