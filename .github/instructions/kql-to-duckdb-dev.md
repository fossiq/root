# KQL to DuckDB Development Guide

## Package Structure

```
packages/kql-to-duckdb/
├── src/
│   ├── index.ts          # Public API
│   ├── translator.ts     # Core translation logic
│   └── types.ts          # Type definitions
├── tests/
│   └── index.test.ts     # Tests
└── package.json
```

## Architecture

**Translation Strategy: CTE Pipeline**

KQL is a pipeline-based language (`Table | where ... | project ...`), while SQL is declarative. To bridge this gap, we use Common Table Expressions (CTEs) to chain operations.

**Input:**
```kql
Table | where Col > 10 | project Col
```

**Translated SQL:**
```sql
WITH 
  cte_0 AS (SELECT * FROM Table WHERE Col > 10),
  cte_1 AS (SELECT Col FROM cte_0)
SELECT * FROM cte_1
```

**Core Components:**

1.  **`translator.ts`**: The main traversal engine.
    *   `translateQuery(node)`: Manages the CTE chain.
    *   `translatePipe(operator)`: Dispatches to specific operator handlers.
    *   `translateExpression(expr)`: Recursive expression converter.

2.  **Parser Integration**:
    *   Uses `@fossiq/kql-parser` to generate the AST.
    *   Requires `initParser(wasmPath)` to be called before usage (web-tree-sitter requirement).

## Usage

```typescript
import { kqlToDuckDB, initParser } from '@fossiq/kql-to-duckdb';

// Initialize parser once (required for web-tree-sitter)
// Path must point to the .wasm file served by your app
await initParser('/tree-sitter-kql.wasm');

const kql = "Table | where Col > 10";
try {
  const duckDbQuery = kqlToDuckDB(kql);
  console.log(duckDbQuery);
} catch (error) {
  console.error("Translation failed:", error);
}
```

## Adding Support for a New Operator

1.  **Update `translatePipe` switch case:**
    Add a case for the new operator type (e.g., `extend_clause`).

2.  **Implement Handler:**
    Create a `translateExtend(operator, inputRelation)` function.
    *   It should return the SQL string for that specific operation.
    *   Use `inputRelation` as the `FROM` table.

3.  **Add Tests:**
    Update `tests/index.test.ts` with a new test case.

## Supported Features

Refer to [KQL to DuckDB Status](kql-to-duckdb-status.md) for the current feature checklist.
