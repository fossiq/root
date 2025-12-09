# KQL to DuckDB Translator

Translates Kusto Query Language (KQL) to DuckDB SQL.

## Installation

```bash
bun add @fossiq/kql-to-duckdb
```

## Usage

```typescript
import { kqlToDuckDB, initParser } from '@fossiq/kql-to-duckdb';

// Initialize parser once (required for web-tree-sitter)
await initParser('/path/to/tree-sitter-kql.wasm');

const kql = "Table | where Status == 'active' | project Name, Score | top 10 by Score desc";
const sql = kqlToDuckDB(kql);
console.log(sql);
```

## Supported Features

| Feature | Status | Notes |
|---------|--------|-------|
| Basic table selection | ✓ | `Table` |
| where clause | ✓ | Filtering with comparisons and binary operators |
| project clause | ✓ | Column selection and renaming |
| extend clause | ✓ | Computed columns |
| summarize clause | ✓ | Aggregations with GROUP BY |
| sort/order by | ✓ | Multi-column with asc/desc |
| distinct | ✓ | Deduplication |
| take/limit | ✓ | Row limiting |
| top | ✓ | Top N with optional ordering |
| join | ✓ | All 8 KQL join kinds (inner, left/right/full outer, anti, semi) |
| union | ✓ | Set operations (inner/outer) |
| String functions | ✓ | substring, tolower, toupper, length, trim, ltrim, rtrim, reverse, replace, split, indexof |
| Aggregation functions | ✓ | count, sum, avg, min, max |
| Arithmetic expressions | ✓ | +, -, *, /, % |
| Comparison operators | ✓ | ==, !=, >, <, >=, <= |
| Binary operators | ✓ | and, or |
| String operators | ✓ | contains, startswith, endswith, matches, has |
| Function calls | ✓ | Generic function support with mapping |

## Unsupported Features

| Feature | Status | Notes |
|---------|--------|-------|
| DateTime functions | ✗ | now(), ago(), todatetime() |
| let statements | ✗ | Variable definitions |
| Subqueries | ✗ | Nested SELECT in FROM |
| mv_expand | ✗ | Multi-value expansion |
| parse operator | ✗ | String parsing with regex patterns |
| search operator | ✗ | Full-text search |
| Math functions | ✗ | round, floor, ceil, etc. |
| Type conversion | ✗ | tostring, toint, etc. |

## Examples

### Filtering and Projection
```kql
Events | where Level == "Error" | project Timestamp, Message
```

### Aggregation
```kql
Sales | summarize sum(Amount), count() by Region | sort by Amount desc
```

### String Processing
```kql
Users | extend Email_Domain = substring(Email, indexof(Email, "@") + 1)
       | project Name, Email_Domain
```

### Multi-table Operations
```kql
Orders | join kind=inner Customers on OrderID == ID | top 100 by Amount desc
```

### Set Operations
```kql
Current_Data | union kind=outer Archive_Data
```

## Architecture

Uses CTE-based pipeline generation to translate KQL's sequential operators into SQL. Each operator becomes a `WITH` clause, maintaining proper data flow.

## License

MIT
