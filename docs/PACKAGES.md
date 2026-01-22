# Package Documentation

**Last Updated:** 2026-01-19

## Package Status Summary

| Package                 | Version | Tests          | Publish    | Maturity   |
| ----------------------- | ------- | -------------- | ---------- | ---------- |
| kql-lezer               | 1.2.0   | Failing (deps) | ✅ npm     | Production |
| kql-to-duckdb           | 1.2.0   | 113 ✅         | ✅ npm     | Production |
| kql-ast                 | 1.2.0   | None           | ✅ npm     | Initial    |
| ui                      | 1.2.0   | Manual         | ❌ Private | Production |
| lezer-grammar-generator | 1.2.0   | ✅ Passing     | ✅ npm     | Complete   |

---

## @fossiq/kql-lezer

**Purpose:** Lezer-based KQL parser with CodeMirror 6 integration

### Technology Stack

- Lezer grammar (`.grammar` file)
- @lezer/generator (compiles grammar → parser)
- @lezer/lr (LRParser runtime)
- Chevrotain (legacy, can be removed)

### Structure

```
src/
├── kql.grammar           # Lezer grammar definition (hand-written)
├── parser.ts             # Generated LRParser (DO NOT EDIT)
├── parser.terms.ts       # Generated term constants
├── index.ts              # Public API (parseKQL)
├── highlight.ts          # Token extraction for highlighting
├── errors.ts             # Error reporting
├── lexer.ts              # Chevrotain lexer (legacy, unused)
└── parser/
    └── cst-to-ast/       # CST → AST mapping
        ├── index.ts      # Main mapper
        ├── context.ts    # Expression handling
        └── operators/    # Operator-specific mappers
```

### Features

**Operators:**

- Tabular: where, project (+4 variants), extend, sort, limit/take, top, distinct, summarize
- Multi-value: mv-expand
- Set operations: union
- Joins: join (8 types)
- Search: search, find

**Expressions:**

- Logical: and, or, not
- Comparison: ==, !=, >, <, >=, <=
- Arithmetic: +, -, \*, /, %
- String: contains, startswith, endswith, has (+ negations, \_cs variants)
- Range: between, !between

**Literals:**

- Numbers (int, float)
- Strings (regular, bracketed identifiers)
- Booleans (true, false)
- Null
- Timespans (1d, 30m, 12h, 500ms)
- Function calls

### Public API

```typescript
import { parseKQL } from "@fossiq/kql-lezer";

const result = parseKQL("Table | where X > 10");
// Returns: { ast, tokens, errors }
```

### Build Process

```bash
# Generate parser from grammar
bun run build:grammar

# Build TypeScript
bun run build

# Test (currently failing - missing @lezer/lr in tests)
bun run test
```

### Known Issues

- **Test failures:** Tests can't find @lezer/lr module (dependency resolution issue)
- **Chevrotain dependency:** Legacy, can be removed from package.json
- **Doc inconsistency:** Some docs mention wrong parser technology

### Package-Specific Docs

- `docs/COMPLETION_SUMMARY.md` - Feature completion status
- `docs/FIX_SUMMARY.md` - Bug fix tracking
- `docs/grammar-reference.md` - Grammar structure reference
- `docs/howto-grammar-debug.md` - Debugging guide
- `docs/features-checklist.md` - Feature implementation checklist

---

## @fossiq/kql-to-duckdb

**Purpose:** Translate KQL AST to DuckDB SQL

### Technology Stack

- Pure TypeScript
- No runtime dependencies (imports types from kql-lezer)

### Structure

```
src/
├── index.ts          # Public API (translateKQL)
├── translator.ts     # Main translation logic
└── types.ts          # Internal types
```

### Translation Strategy

**CTE Pipeline:**

```sql
-- Input: Table | where X > 10 | project Y
WITH cte_0 AS (SELECT * FROM Table WHERE X > 10),
     cte_1 AS (SELECT Y FROM cte_0)
SELECT * FROM cte_1
```

Each KQL operator → one CTE → chained via references.

### Supported Features

**Operators (11):**

- where - Row filtering
- project - Column selection
- extend - Computed columns
- summarize - Aggregations with GROUP BY
- sort/order - Result ordering
- limit/take - Row limiting
- top - Top N by expression
- distinct - Deduplication
- union - Combine tables (inner/outer)
- mv-expand - Array expansion (UNNEST)
- search - Text search across columns

**Join Types (8):**

- inner, leftouter, rightouter, fullouter
- leftanti, rightanti, leftsemi, rightsemi

**Functions (35+):**

- **String:** substring, tolower, toupper, length, trim, ltrim, rtrim, reverse, replace, split, indexof
- **Math:** round, floor, ceil, abs, sqrt, pow, log, log10, exp, sin, cos, tan
- **Type conversion:** tostring, toint, todouble, tobool, tolong, tofloat, todatetime, totimespan
- **DateTime:** now, ago

**Expressions:**

- Arithmetic: +, -, \*, /, %
- Comparison: ==, !=, >, <, >=, <=
- Logical: and, or, not
- String: contains, startswith, endswith, matches, has
- between, in
- Function calls

### Public API

```typescript
import { translateKQL } from "@fossiq/kql-to-duckdb";

const sql = translateKQL("Table | where X > 10 | project Y");
// Returns DuckDB SQL string
```

### Tests

**113 passing tests** covering:

- Simple table references
- All 11 operators
- 8 join types
- 35+ function mappings
- Complex multi-operator pipelines
- Let statement variable substitution
- Error cases

```bash
# Run tests (currently failing - no test files found)
bun run test
```

**Note:** Test command expects `tests/` directory but may not find files due to glob pattern mismatch.

### Known Limitations

**Parse operator:** Not supported (architectural constraint)

- KQL `parse` creates dynamic columns based on regex
- SQL requires predefined schema
- No standard SQL equivalent for pattern-based column extraction

**Subqueries:** Not yet implemented

### Package-Specific Docs

- `docs/kql-to-duckdb-status.md` - Comprehensive phase tracking
- `docs/kql-to-duckdb-dev.md` - Development guide

---

## @fossiq/kql-ast

**Purpose:** Shared AST type definitions (language-agnostic)

### Status

- **Phase 1 Complete:** Types defined
- **Phase 2-4 Pending:** Documentation, build, integration

### Design Principles

1. **Language Agnostic:** No Lezer or tree-sitter dependencies
2. **Position Tracking:** All nodes have start/end offsets
3. **Discriminated Unions:** Type-safe via `type` field
4. **Optional Properties:** Parsers choose what to include

### Core Types

```typescript
interface ASTNode {
  type: string;
  start: number;
  end: number;
}

interface KQLDocument extends ASTNode {
  type: "KQLDocument";
  statements: Statement[];
}

interface ParseResult {
  ast?: KQLDocument;
  tokens?: HighlightToken[];
  errors: ParseError[];
}
```

### Token Types for Highlighting

- Keywords: `keyword`
- Identifiers: `identifier`, `functionName`, `columnName`, `tableName`
- Operators: `operator`, `comparisonOperator`, `logicalOperator`
- Literals: `string`, `number`, `boolean`
- Structural: `punctuation`, `comment`, `whitespace`
- Error: `invalid`

### Package-Specific Docs

- `docs/kql-ast-status.md` - Phase tracking
- `docs/kql-ast-dev.md` - Development guide

---

## @fossiq/ui

**Purpose:** Browser-based KQL query interface

### Technology Stack

- **Framework:** SolidJS 1.8+
- **Build:** Vite
- **Styling:** PicoCSS (semantic, classless)
- **Editor:** CodeMirror 6 + kql-lezer
- **Database:** DuckDB WASM
- **Table:** TanStack Solid Table + Solid Virtual
- **Persistence:** IndexedDB (file handles) + localStorage (query/results)

### Structure

```
src/
├── App.tsx                    # Main layout
├── components/
│   ├── Editor.tsx             # CodeMirror wrapper
│   └── ResultsTable.tsx       # Virtualized table
├── contexts/
│   └── SchemaContext.tsx      # DuckDB connection
├── hooks/
│   └── useTheme.ts            # Theme management
└── styles/
    └── theme.css              # CSS variables + grid styles
```

### Features

**Complete (Phase 7):**

- ✅ Layout with header, editor, results, sidebar
- ✅ Light/dark theme (manual toggle + system preference)
- ✅ CodeMirror integration with KQL syntax highlighting
- ✅ Run/Clear query buttons
- ✅ DuckDB WASM integration
- ✅ CSV import via File System Access API
- ✅ Results table with virtualization
- ✅ File persistence across page reloads
- ✅ Query/results persistence (localStorage)
- ✅ Schema-aware autocomplete

**Pending:**

- Improve syntax highlighting color vibrancy

### Key Implementation Details

**Theme Management:**

- localStorage key: `fossiq-theme`
- DOM classes: `theme-light`, `theme-dark` on `<html>`
- CSS variables in `:root.theme-dark` override system preference
- Manual toggle takes precedence over system

**File Persistence:**

- File handles stored in IndexedDB
- On page reload: show "Restore X files" button
- User grants permission → files reload
- Graceful degradation if File System Access API unavailable

**Results Table:**

- CSS Grid layout (NOT `<table>`)
- Column template: `repeat(N, minmax(150px, 1fr))`
- Virtual scrolling via @tanstack/solid-virtual
- `min-width: 0` required for text truncation in grid

**DuckDB Integration:**

- WASM files in `public/` (duckdb-eh.wasm, worker)
- Connection managed in SchemaContext
- Tables registered via `INSERT INTO` from CSV data
- Query execution: KQL → SQL → DuckDB → results

### Development

```bash
cd packages/ui
bun install
bun run dev
# Visit http://localhost:5173
```

### Known Gotchas

1. **Theme switching:** Must update DOM classes, not just CSS media queries
2. **Grid truncation:** Requires `min-width: 0` on grid children
3. **Virtual rows:** Need `left: 0` AND `right: 0` for proper alignment
4. **DuckDB files:** Must be in `public/`, not bundled
5. **SolidJS reactivity:** Use `createMemo` for derived data, not useMemo

### Package-Specific Docs

- `docs/ui-status.md` - Detailed phase tracking with gotchas
- `docs/ui-dev.md` - Implementation guide

---

## @fossiq/lezer-grammar-generator

**Purpose:** Generate Lezer `.grammar` text from TypeScript objects

### Status

✅ **Feature complete** for intended scope

### Features

**Supported:**

- Type-safe grammar definitions
- Deterministic serialization
- Validation with structured errors
- Pattern expression helpers
- Multiple regex patterns
- Macros, precedence, dialects, skip blocks
- Eta.js templating integration

**Out of Scope (intentional):**

- Running lezer-generator (separate tool)
- Producing parser modules
- Grammar conflict detection
- @extend operator
- Token properties
- Precedence markers (!name)

### Public API

```typescript
import { generateGrammar } from "@fossiq/lezer-grammar-generator";

const def = {
  name: "MyLanguage",
  rules: {
    Expression: { alternatives: ["BinaryExpr", "Literal"] },
  },
};

const grammarText = generateGrammar(def);
// Returns: "Expression { BinaryExpr | Literal }"
```

### Package-Specific Docs

- `docs/lezer-grammar-generator-spec.md` - Specification
- `docs/lezer-grammar-generator-status.md` - Feature checklist

---

## Package Dependencies

```
kql-ast (no deps)
  ↓
kql-lezer (depends on: kql-ast, @lezer/generator, @lezer/lr)
  ↓
kql-to-duckdb (imports types from kql-lezer, but no runtime dep)
  ↓
ui (depends on: kql-lezer, kql-to-duckdb)

lezer-grammar-generator (independent)
```

## Publishing Status

Publishing is automated via GitHub Actions (see `.github/workflows/`):

1. **Create changeset:** `bun run changeset`
2. **Merge PR** → Changesets action creates a "Release" PR
3. **Merge Release PR** → Packages published to GitHub Packages, UI deployed
4. **Manual npm publish:** `bun run publish:npm`

**Private:** Only `ui` is marked private (not published to npm)
