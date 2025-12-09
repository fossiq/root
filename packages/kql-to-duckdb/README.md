# KQL to DuckDB Translator

Translates Kusto Query Language (KQL) to DuckDB SQL.

## Installation

```bash
bun add @fossiq/kql-to-duckdb
```

## Usage

```typescript
import { kqlToDuckDB, initParser } from "@fossiq/kql-to-duckdb";

// Initialize parser once (required for web-tree-sitter)
await initParser("/path/to/tree-sitter-kql.wasm");

const kql =
  "Table | where Status == 'active' | project Name, Score | top 10 by Score desc";
const sql = kqlToDuckDB(kql);
console.log(sql);
```

## Supported Features

| Feature                | Status | Notes                                                                                     |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Basic table selection  | ✓      | `Table`                                                                                   |
| where clause           | ✓      | Filtering with comparisons and binary operators                                           |
| project clause         | ✓      | Column selection and renaming                                                             |
| extend clause          | ✓      | Computed columns                                                                          |
| summarize clause       | ✓      | Aggregations with GROUP BY                                                                |
| sort/order by          | ✓      | Multi-column with asc/desc                                                                |
| distinct               | ✓      | Deduplication                                                                             |
| take/limit             | ✓      | Row limiting                                                                              |
| top                    | ✓      | Top N with optional ordering                                                              |
| join                   | ✓      | All 8 KQL join kinds (inner, left/right/full outer, anti, semi)                           |
| union                  | ✓      | Set operations (inner/outer)                                                              |
| String functions       | ✓      | substring, tolower, toupper, length, trim, ltrim, rtrim, reverse, replace, split, indexof |
| Math functions         | ✓      | round, floor, ceil, abs, sqrt, pow, log, log10, exp, sin, cos, tan                        |
| Type conversion        | ✓      | tostring, toint, todouble, tobool, tolong, tofloat, todatetime, totimespan                |
| Aggregation functions  | ✓      | count, sum, avg, min, max                                                                 |
| Arithmetic expressions | ✓      | +, -, \*, /, %                                                                            |
| Comparison operators   | ✓      | ==, !=, >, <, >=, <=                                                                      |
| Binary operators       | ✓      | and, or                                                                                   |
| String operators       | ✓      | contains, startswith, endswith, matches, has                                              |
| Function calls         | ✓      | Generic function support with mapping                                                     |

## Unsupported Features

| Feature            | Status | Notes                                                  |
| ------------------ | ------ | ------------------------------------------------------ |
| DateTime functions | ✗      | now(), ago(), etc. - require runtime context           |
| let statements     | ✗      | Variable definitions - would require AST preprocessing |
| Subqueries         | ✗      | Nested SELECT in FROM - complex scope handling         |
| mv_expand          | ✗      | Multi-value expansion - array unpacking                |
| parse operator     | ✗      | Complex - see limitations below                        |
| search operator    | ✗      | Full-text search - not in scope                        |

### Why parse operator is unsupported

The KQL `parse` operator extracts structured data from strings using regex or simple patterns. It requires:

1. **Dynamic column creation** - Regex groups become new columns at runtime
2. **Schema modification** - Changes output schema based on pattern
3. **Pattern evaluation** - Complex regex handling with named capture groups
4. **SQL limitations** - Standard SQL lacks equivalent feature

Workaround: Pre-process data with application logic or use DuckDB's `regexp_extract()` for simple cases.

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
