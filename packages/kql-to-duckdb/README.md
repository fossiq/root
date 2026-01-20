# @fossiq/kql-to-duckdb

Translates Kusto Query Language (KQL) to DuckDB SQL.

## Installation

```bash
bun add @fossiq/kql-to-duckdb
```

## Usage

```typescript
import { kqlToDuckDB } from "@fossiq/kql-to-duckdb";

const kql = "Events | where Level == 'Error' | project Timestamp, Message | take 10";
const sql = kqlToDuckDB(kql);
console.log(sql);
// Output: WITH cte_0 AS (SELECT * FROM Events WHERE Level = 'Error'), 
//         cte_1 AS (SELECT Timestamp, Message FROM cte_0),
//         cte_2 AS (SELECT * FROM cte_1 LIMIT 10)
//         SELECT * FROM cte_2
```

No initialization required - parsing is synchronous and instant.

## Supported Features

### Operators

| Operator | Status | Notes |
|----------|--------|-------|
| `where` | ✓ | Filtering with comparisons and logical operators |
| `project` | ✓ | Column selection with aliases and expressions |
| `project-away` | ✓ | Exclude columns via `SELECT * EXCLUDE (...)` |
| `project-keep` | ✓ | Keep only specified columns |
| `project-rename` | ✓ | Rename columns via `SELECT * REPLACE (...)` |
| `project-reorder` | ✓ | Reorder columns |
| `extend` | ✓ | Add computed columns |
| `summarize` | ✓ | Aggregations with GROUP BY |
| `sort`/`order by` | ✓ | Multi-column with asc/desc, nulls first/last |
| `distinct` | ✓ | Deduplication |
| `take`/`limit` | ✓ | Row limiting |
| `top` | ✓ | Top N with ordering |
| `join` | ✓ | All 8 KQL join types (inner, left/right/full outer, left/right anti, left/right semi) |
| `union` | ✓ | Set operations (inner/outer) |
| `mv-expand` | ✓ | Multi-value expansion via UNNEST |

### Expressions

| Feature | Status | Examples |
|---------|--------|----------|
| Comparison operators | ✓ | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Logical operators | ✓ | `and`, `or`, `not` |
| Arithmetic | ✓ | `+`, `-`, `*`, `/`, `%` |
| String operators | ✓ | `contains`, `startswith`, `endswith`, `has`, `matches` |
| Parenthesized expressions | ✓ | `(a + b) * c` |
| Function calls | ✓ | `count()`, `sum(Amount)`, `tolower(Name)` |

### Functions

**String Functions**
- `substring`, `tolower`, `toupper`, `length`, `trim`, `ltrim`, `rtrim`
- `reverse`, `replace`, `split`, `indexof`, `strcat`

**Math Functions**
- `round`, `floor`, `ceil`, `abs`, `sqrt`, `pow`
- `log`, `log10`, `exp`, `sin`, `cos`, `tan`

**Type Conversion**
- `tostring`, `toint`, `todouble`, `tobool`
- `tolong`, `tofloat`, `todatetime`, `totimespan`

**Aggregation Functions**
- `count`, `sum`, `avg`, `min`, `max`
- `dcount` (distinct count)

**DateTime Functions**
- `now()`, `ago()`, `datetime()`, `format_datetime()`

## Unsupported Features

| Feature | Status | Notes |
|---------|--------|-------|
| `parse` operator | ✗ | Requires dynamic column creation and regex patterns |
| Subqueries | ✗ | Nested SELECT in FROM clause |
| `search` | ✗ | Full-text search |
| `find` | ✗ | Cross-table search |

### Why parse operator is unsupported

The KQL `parse` operator extracts structured data from strings using patterns. It requires:
1. Dynamic column creation from regex groups
2. Runtime schema modification
3. Complex pattern evaluation

Workaround: Use DuckDB's `regexp_extract()` or pre-process data.

## Examples

### Basic Query

```typescript
import { kqlToDuckDB } from "@fossiq/kql-to-duckdb";

const sql = kqlToDuckDB(`
  Events 
  | where Level == "Error" 
  | project Timestamp, Message
  | take 10
`);
```

### Aggregation

```typescript
const sql = kqlToDuckDB(`
  Sales 
  | summarize TotalRevenue = sum(Amount), OrderCount = count() by Region
  | sort by TotalRevenue desc
`);
```

### Join

```typescript
const sql = kqlToDuckDB(`
  Orders 
  | join kind=inner Customers on CustomerID == ID
  | project OrderDate, CustomerName, Amount
`);
```

### String Processing

```typescript
const sql = kqlToDuckDB(`
  Users 
  | extend Domain = substring(Email, indexof(Email, "@") + 1)
  | project Name, Domain
`);
```

### Column Operations

```typescript
const sql = kqlToDuckDB(`
  Users 
  | project-rename DisplayName = Name
  | project-away Password, SSN
  | project-reorder Email, DisplayName
`);
```

## Architecture

Uses CTE-based pipeline generation:
1. Each KQL operator becomes a `WITH` clause (CTE)
2. Operators reference previous CTEs
3. Final `SELECT` references last CTE

This maintains KQL's sequential semantics while generating efficient SQL.

### Example Translation

```kql
Events 
| where Level == "Error"
| project Timestamp, Message
| take 10
```

Becomes:

```sql
WITH 
  cte_0 AS (SELECT * FROM Events WHERE Level = 'Error'),
  cte_1 AS (SELECT Timestamp, Message FROM cte_0),
  cte_2 AS (SELECT * FROM cte_1 LIMIT 10)
SELECT * FROM cte_2
```

## Development

```bash
# Build
bun run build

# Run linter
bun run lint
```

## Related Packages

- **@fossiq/kql-lezer** - Parser that generates the AST
- **@fossiq/kql-ast** - Shared AST type definitions

## License

MIT
