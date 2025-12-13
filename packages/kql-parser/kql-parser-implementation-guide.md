# AI GENERATED - 
# Generic KQL parser implementation guide for developers

Building a KQL (Kusto Query Language) parser or KQL-to-SQL converter requires understanding a pipe-based, left-to-right data flow language with **over 40 tabular operators**, **200+ built-in functions**, and unique constructs like `mv-expand` and `make-series` that have no direct SQL equivalents. This guide provides the complete technical specifications, grammar rules, operator catalogs, and conversion strategies needed for implementation. The Microsoft official parser repository at `github.com/microsoft/Kusto-Query-Language` offers a production-ready C# implementation, while several open-source alternatives exist for Python and Rust.

## Query structure follows a strict pipe-based data flow model

KQL queries are composed of **statements separated by semicolons**, with data flowing left-to-right through operators connected by the pipe character (`|`). Every query fundamentally follows this pattern:

```
TableSource | Operator1 | Operator2 | ... | OperatorN
```

The three primary statement types are:

- **Tabular Expression Statements**: The core query mechanism where data flows through operators
- **Let Statements**: Bind names to expressions or define inline functions
- **Set Statements**: Configure query options

A complete query may combine these:

```kql
let threshold = 100;
let FilterEvents = (T:(Value:long)) { T | where Value > threshold };
StormEvents | invoke FilterEvents() | summarize count() by State | sort by count_ desc
```

**Critical parser rule**: Let statements must end with semicolons and no blank lines are permitted between consecutive let statements or between let statements and the following query. This whitespace constraint affects lexer design.

## Formal grammar rules for lexer implementation

### Token types and identifier rules

KQL identifiers follow specific naming conventions essential for lexer implementation:

| Token Category | Rules |
|----------------|-------|
| Identifiers | 1-1024 characters; letters (Unicode), digits, underscores; case-sensitive |
| Quoted Identifiers | `['name']` or `["name"]` for special characters, spaces, keywords as names |
| Keywords | Reserved words like `where`, `project`, `let`, `and`, `or`, `not` |
| Operators | `|`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `=~`, `!~`, `+`, `-`, `*`, `/`, `%` |
| Delimiters | `;`, `,`, `(`, `)`, `[`, `]`, `{`, `}`, `.`, `..` |

**Double underscore** (`__`) at the start or end of identifiers is reserved for system use. The `$` character appears only in system-generated column names.

### Literal syntax specifications

String literals support four forms requiring distinct lexer handling:

```
Standard:    "text with \"escapes\""  or  'text with \'escapes\''
Verbatim:    @"C:\path\file.txt"      or  @'no escapes except '' for quote'
Multi-line:  ```triple backtick
             spans lines```
Obfuscated:  h"secret"  or  h@"verbatim secret"  (logged as **** in telemetry)
```

**Escape sequences** in standard strings: `\\` (backslash), `\"` or `\'` (quotes), `\t` (tab), `\n` (newline), `\r` (return), `\uXXXX` (Unicode).

Numeric literals:
```
Integers:   123, -456, 0
Real:       3.14, -0.001, 1.5e10, real(123)
```

DateTime and timespan literals require function-style syntax:
```
datetime(2024-01-15T10:30:00.1234567Z)
timespan(2.02:03:04)  or shorthand:  1d, 2h, 30m, 45s, 100ms
```

Timespan shorthand units: `d` (days), `h` (hours), `m` (minutes), `s` (seconds), `ms` (milliseconds), `microsecond`, `tick` (100 nanoseconds). Units can combine: `1d2h30m`.

### Operator precedence hierarchy

Expression evaluation follows this precedence (highest to lowest):

1. **Unary operators**: `not`, unary `-`
2. **Multiplicative**: `*`, `/`, `%`
3. **Additive**: `+`, `-`
4. **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`, `between`, string operators
5. **Logical AND**: `and`
6. **Logical OR**: `or`

Parentheses override precedence. The pipe operator (`|`) has the lowest precedence, chaining entire operator results.

## Complete tabular operator reference

Tabular operators transform tabular input to tabular output. Here is the complete catalog with syntax patterns:

### Filtering and selection operators

| Operator | Syntax | Description |
|----------|--------|-------------|
| `where` | `T \| where Predicate` | Filter rows by boolean condition |
| `search` | `search [kind=cs] [in (Tables)] "term"` | Full-text search across tables |
| `find` | `find [withsource=Col] in (Tables) where Pred` | Find matching rows across tables |
| `take`/`limit` | `T \| take N` | Return N arbitrary rows |
| `sample` | `T \| sample N` | Return N random rows |
| `distinct` | `T \| distinct Col1, Col2` | Unique value combinations |

### Projection operators

| Operator | Syntax | Description |
|----------|--------|-------------|
| `project` | `T \| project Col1, NewCol=Expr` | Select and compute columns |
| `project-away` | `T \| project-away Col*, Pattern` | Exclude columns (supports wildcards) |
| `project-keep` | `T \| project-keep Col1, Col2` | Keep only specified columns |
| `project-rename` | `T \| project-rename NewName=OldName` | Rename columns |
| `project-reorder` | `T \| project-reorder Col2, Col1` | Reorder column output |
| `extend` | `T \| extend NewCol=Expr` | Add computed columns |

### Aggregation operators

The `summarize` operator is KQL's primary aggregation mechanism:

```kql
T | summarize [ResultCol=] AggFunction [, ...] [by [GroupCol=] GroupExpr [, ...]]
```

**Aggregation functions** for use with `summarize`:

| Function | Description | SQL Equivalent |
|----------|-------------|----------------|
| `count()` | Row count | `COUNT(*)` |
| `countif(pred)` | Conditional count | `COUNT(CASE WHEN pred THEN 1 END)` |
| `dcount(col)` | Approximate distinct count | `COUNT(DISTINCT col)` (approximate) |
| `sum(col)`, `sumif(col,pred)` | Sum values | `SUM(col)` |
| `avg(col)`, `avgif(col,pred)` | Average | `AVG(col)` |
| `min(col)`, `max(col)` | Min/max values | `MIN(col)`, `MAX(col)` |
| `percentile(col,n)` | Nth percentile | `PERCENTILE_CONT(n)` |
| `stdev(col)`, `variance(col)` | Statistical measures | `STDDEV(col)`, `VAR(col)` |
| `arg_max(col,*)` | Row with max value | Complex subquery |
| `arg_min(col,*)` | Row with min value | Complex subquery |
| `make_list(col)` | Collect into array | `JSON_AGG(col)` |
| `make_set(col)` | Collect unique into array | `JSON_AGG(DISTINCT col)` |
| `make_bag(col)` | Collect into property bag | No direct equivalent |

### Join operators with all flavors

```kql
LeftTable | join [kind=JoinKind] [hint.strategy=Strategy] (RightTable) on Conditions
```

**Join kind mapping to SQL**:

| KQL Join Kind | Behavior | SQL Equivalent |
|---------------|----------|----------------|
| `innerunique` (default) | Inner join with left dedup | `INNER JOIN` with `DISTINCT` |
| `inner` | Standard inner join | `INNER JOIN` |
| `leftouter` | All left rows, matching right | `LEFT OUTER JOIN` |
| `rightouter` | All right rows, matching left | `RIGHT OUTER JOIN` |
| `fullouter` | All rows from both tables | `FULL OUTER JOIN` |
| `leftsemi` | Left rows with matches (left cols only) | `WHERE EXISTS (SELECT ...)` |
| `rightsemi` | Right rows with matches (right cols only) | `WHERE EXISTS (SELECT ...)` |
| `leftanti` | Left rows without matches | `LEFT JOIN WHERE right.key IS NULL` |
| `rightanti` | Right rows without matches | `RIGHT JOIN WHERE left.key IS NULL` |

**Join conditions** support both simple column matching (`on CommonCol`) and explicit conditions (`on $left.Col1 == $right.Col2`).

### Sorting and limiting operators

| Operator | Syntax | Notes |
|----------|--------|-------|
| `sort by`/`order by` | `T \| sort by Col [asc\|desc] [nulls first\|last]` | Default: descending |
| `top` | `T \| top N by Col [asc\|desc]` | Combined sort + limit |
| `top-nested` | `T \| top-nested N of Col by Agg` | Hierarchical top results |

### Union operator

```kql
union [kind=inner|outer] [withsource=SourceCol] Table1, Table2, ...
```

- `kind=outer` (default): All columns from all tables
- `kind=inner`: Only columns common to all tables
- `withsource`: Adds column indicating source table

## Scalar operators for expressions

### String operators with case sensitivity variants

| Operator | Case-Sensitive | Description | SQL Mapping |
|----------|----------------|-------------|-------------|
| `==` | Yes | Exact equality | `=` |
| `=~` | No | Case-insensitive equality | `LOWER(a) = LOWER(b)` |
| `contains` | No | Substring match | `LIKE '%str%'` |
| `contains_cs` | Yes | Case-sensitive substring | `LIKE '%str%' COLLATE` |
| `has` | No | Word/term match | Full-text or tokenized `LIKE` |
| `has_cs` | Yes | Case-sensitive word match | Full-text with collation |
| `startswith` | No | Prefix match | `LIKE 'prefix%'` |
| `endswith` | No | Suffix match | `LIKE '%suffix'` |
| `matches regex` | Yes | Regex pattern match | `REGEXP_LIKE()` |
| `in` | Yes | Set membership | `IN (...)` |
| `in~` | No | Case-insensitive set | `LOWER(col) IN (...)` |

**Performance note**: `has` operators use term index lookup and are faster than `contains`/`startswith`/`endswith`.

### Between operator

```kql
T | where Value between (10 .. 100)
T | where Timestamp between (datetime(2024-01-01) .. datetime(2024-12-31))
```

Works with `int`, `long`, `real`, `datetime`, `timespan`. Negation: `!between`.

### Conditional expressions

```kql
// iff (immediate if)
extend Status = iff(Value > 100, "High", "Low")

// case (multiple conditions)
extend Grade = case(
    Score >= 90, "A",
    Score >= 80, "B",
    Score >= 70, "C",
    "F"
)
```

## Data types with SQL equivalents

| KQL Type | Aliases | Literal Syntax | SQL Equivalent |
|----------|---------|----------------|----------------|
| `bool` | `boolean` | `true`, `false`, `bool(1)` | `BIT` |
| `datetime` | `date` | `datetime(2024-01-15)` | `DATETIME2` |
| `decimal` | — | `decimal(1.5)` | `DECIMAL(38,18)` |
| `dynamic` | — | `dynamic([1,2,3])`, `dynamic({"k":"v"})` | `NVARCHAR(MAX)` as JSON |
| `guid` | `uuid`, `uniqueid` | `guid(74be27de-...)` | `UNIQUEIDENTIFIER` |
| `int` | — | `int(123)`, plain integers | `INT` |
| `long` | — | `long(...)`, large integers | `BIGINT` |
| `real` | `double` | `real(3.14)`, `1.5e10` | `FLOAT` |
| `string` | — | `"text"`, `'text'` | `NVARCHAR(MAX)` |
| `timespan` | `time` | `timespan(1d)`, `1d`, `2h30m` | `TIME` or computed |

**Type conversion functions**: `tostring()`, `toint()`, `tolong()`, `todouble()`/`toreal()`, `todecimal()`, `tobool()`, `todatetime()`, `totimespan()`, `toguid()`.

## Built-in function categories

### DateTime functions

| Function | Description | SQL Mapping |
|----------|-------------|-------------|
| `now()` | Current UTC time | `CURRENT_TIMESTAMP` |
| `ago(timespan)` | Time relative to now | `CURRENT_TIMESTAMP - INTERVAL` |
| `datetime_add(part,n,dt)` | Add time units | `DATEADD(part,n,dt)` |
| `datetime_diff(part,dt1,dt2)` | Difference in units | `DATEDIFF(part,dt1,dt2)` |
| `startofday/week/month/year()` | Period start | `DATE_TRUNC()` |
| `dayofweek/month/year()` | Extract component | `EXTRACT(...)` |
| `format_datetime(dt,format)` | Format to string | `FORMAT(dt,format)` |

### String functions

| Function | Description | SQL Mapping |
|----------|-------------|-------------|
| `strlen(s)` | String length | `LEN(s)` / `LENGTH(s)` |
| `substring(s,start,len)` | Extract substring | `SUBSTRING(s,start,len)` |
| `strcat(s1,s2,...)` | Concatenate | `CONCAT(s1,s2,...)` |
| `split(s,delimiter)` | Split to array | `STRING_SPLIT()` |
| `tolower(s)`, `toupper(s)` | Case conversion | `LOWER(s)`, `UPPER(s)` |
| `trim(s)` | Trim whitespace | `TRIM(s)` |
| `replace_string(s,old,new)` | Replace text | `REPLACE(s,old,new)` |
| `extract(regex,group,s)` | Regex extraction | `REGEXP_EXTRACT()` |
| `parse_json(s)` | Parse JSON string | `JSON_PARSE()` |

### Mathematical functions

`abs()`, `round()`, `floor()`, `ceiling()`, `sqrt()`, `pow()`, `exp()`, `log()`, `log10()`, `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `rand()`, `sign()`, `pi()`.

### Dynamic/Array functions

`array_length()`, `array_concat()`, `array_slice()`, `array_sort_asc()`, `array_index_of()`, `bag_keys()`, `bag_merge()`, `pack()`, `set_union()`, `set_intersect()`, `set_difference()`.

## Special constructs requiring careful parsing

### Let statements for variables and functions

```kql
// Scalar variable
let threshold = 100;

// Tabular expression
let activeUsers = Users | where IsActive == true;

// Scalar function
let MultiplyByN = (val:long, n:long) { val * n };

// Tabular function (requires invoke to call)
let FilterByState = (T:(State:string), state:string) { T | where State == state };
StormEvents | invoke FilterByState("TEXAS")

// View function (creates searchable virtual table)
let Range10 = view () { range x from 1 to 10 step 1 };
```

**Parser challenges**: Distinguish scalar vs tabular vs function definitions by syntax; enforce semicolon termination; track scoping for nested lets; handle optional `view` keyword.

### materialize() and toscalar() functions

```kql
// Cache subquery results for multiple uses
let cachedData = materialize(ExpensiveQuery);
cachedData | summarize count();
cachedData | top 10 by Value;

// Convert tabular to scalar (first column, first row)
let minTime = toscalar(Events | summarize min(Timestamp));
let maxTime = toscalar(Events | summarize max(Timestamp));
Events | where Timestamp between (minTime .. maxTime)
```

**Cache limit**: 5 GB per cluster node for `materialize()`.

### mv-expand for array expansion

```kql
// Basic array expansion
T | mv-expand ArrayColumn

// With type casting
T | mv-expand element = ArrayColumn to typeof(long)

// With item index
T | mv-expand with_itemindex=idx ArrayColumn

// Property bag as key-value pairs
T | mv-expand kind=array PropBag | extend key=PropBag[0], val=PropBag[1]

// Parallel expansion (zip)
T | mv-expand Col1, Col2

// Limit rows per input
T | mv-expand ArrayColumn limit 100
```

**Behavior notes**: Null dynamic values produce one row with null; empty arrays produce zero rows; non-expanded columns are duplicated to all output rows.

**SQL conversion challenge**: Requires `LATERAL JOIN` + `UNNEST()` (PostgreSQL), `CROSS APPLY` + `OPENJSON()` (SQL Server), or recursive processing.

### mv-apply for subqueries on expanded arrays

```kql
T | mv-apply element=ArrayCol to typeof(long) on (
    top 2 by element
    | summarize Sum=sum(element)
)
```

This expands arrays, applies the subquery to each expansion, then unions results. **Very complex SQL conversion** requiring lateral subqueries with aggregation.

### make-series for time series generation

```kql
T | make-series Count=count() default=0 
    on Timestamp from datetime(2024-01-01) to datetime(2024-12-31) step 1d 
    by Category
```

Creates regular time series with filled gaps. **Array output limit**: 1,048,576 values. Related fill functions: `series_fill_forward()`, `series_fill_backward()`, `series_fill_const()`, `series_fill_linear()`.

**SQL conversion requires**: Date range generation + aggregation + pivot + array construction—extremely complex.

### parse operator with pattern matching

```kql
// Simple pattern
T | parse Message with "Error " ErrorCode:int " on " ServerName

// Regex mode
T | parse kind=regex flags=Ui EventText with * "resourceName=" resourceName ","

// Relaxed mode (allows partial matches)
T | parse kind=relaxed Message with "Status: " Status
```

**Parse modes**: `simple` (default, strict), `regex` (RE2 syntax), `relaxed` (partial matching with nulls).

### evaluate plugins

```kql
// Unpack property bag to columns
T | evaluate bag_unpack(DynamicColumn, 'Prefix_')

// Pivot table
T | evaluate pivot(Category, sum(Value))

// With output schema hint for performance
T | evaluate bag_unpack(d) : (Name:string, Age:long, *)
```

Plugin parameters vary significantly. Distribution hints: `hint.distribution = single|per_node|per_shard`.

## KQL-to-SQL conversion strategy

### Recommended implementation approach

**Parse → Transform → Generate** pipeline:

```
KQL: "T | where x > 10 | project a, b"
  ↓ Parse (using Microsoft parser or custom)
AST: [Table("T"), Where(BinaryOp(">", Col("x"), 10)), Project(["a","b"])]
  ↓ Transform to SQL IR
IR: Select(["a","b"], Filter(">", "x", 10), Table("T"))
  ↓ Generate
SQL: "SELECT a, b FROM T WHERE x > 10"
```

### Pipe chaining with CTEs pattern

For complex multi-operator queries, use Common Table Expressions to preserve KQL's sequential semantics:

```sql
-- KQL: T | where x > 10 | extend y = x * 2 | summarize sum(y) by z
WITH cte1 AS (
  SELECT * FROM T WHERE x > 10
),
cte2 AS (
  SELECT *, x * 2 AS y FROM cte1
)
SELECT z, SUM(y) FROM cte2 GROUP BY z
```

### Core operator mappings

| KQL Pattern | SQL Generation |
|-------------|----------------|
| `TableName` | `FROM TableName` |
| `\| where cond` | `WHERE cond` (or CTE) |
| `\| project cols` | `SELECT cols` |
| `\| extend new=expr` | `SELECT *, expr AS new` |
| `\| summarize agg by grp` | `SELECT grp, agg GROUP BY grp` |
| `\| sort by col` | `ORDER BY col` |
| `\| take N` | `LIMIT N` / `TOP N` |
| `\| join kind=X (T2) on key` | `X JOIN T2 ON key` |
| `\| union T1, T2` | `UNION ALL` |
| `let var = expr` | `WITH var AS (expr)` |

### Features with no direct SQL equivalent

| KQL Feature | Conversion Complexity | Workaround |
|-------------|----------------------|------------|
| `mv-expand` | **HIGH** | LATERAL + UNNEST or CROSS APPLY + JSON functions |
| `mv-apply` | **VERY HIGH** | Complex lateral subqueries |
| `make-series` | **VERY HIGH** | Date generation + pivot + array aggregation |
| `evaluate` plugins | **VERY HIGH** | UDFs or application-side processing |
| `let` functions | **HIGH** | Pre-expand at conversion time |
| `render` | **N/A** | Ignore (visualization hint only) |
| `dynamic` type operations | **HIGH** | JSON functions (database-specific) |
| `parse` with regex | **MEDIUM** | REGEXP_EXTRACT (syntax varies) |
| `range` | **MEDIUM** | GENERATE_SERIES or recursive CTE |

## Existing parser implementations

### Microsoft official parser (recommended for production)

**Repository**: `github.com/microsoft/Kusto-Query-Language`
**Package**: `Microsoft.Azure.Kusto.Language` (NuGet)
**Languages**: C# (primary), JavaScript (via Bridge.NET)

```csharp
// Basic parsing
var code = KustoCode.Parse("T | where x > 10");

// With semantic analysis (requires schema)
var globals = GlobalState.Default.WithDatabase(myDatabase);
var code = KustoCode.ParseAndAnalyze("T | where x > 10", globals);
```

**Key components**:
- `KustoCode.Parse()` — Syntax parsing only
- `KustoCode.ParseAndAnalyze()` — Full semantic analysis
- `QueryGrammar.cs`, `CommandGrammar.cs` — Grammar definitions
- `Parser<TInput,TOutput>` — Parser combinator base classes

Uses **parser combinators**, not ANTLR. AST nodes include `SyntaxNode`, `SyntaxToken`, `Expression`, `QueryOperator`, `Statement`.

### Python ANTLR-based parser

**Repository**: `github.com/tedyeates/kusto-query-language-python-parser`
**Package**: `pip install kusto-query-language-parser`

```python
from kusto_query_language_parser.parser.kql_traverse import KqlTraverse
parser = KqlTraverse()
tree = parser.parse(input_stream)
json_tree = parser.get_json_tree(parser.traverse(tree))
```

### Rust parser with DataFusion integration

**Repository**: `github.com/irtimmer/rust-kql`
Uses `nom` parser combinators with Apache Arrow/DataFusion integration. Supports most operators with both parsing and query planning.

### BabyKusto (embedded execution)

**Package**: `BabyKusto.Core` (NuGet)
Leverages Microsoft's parser, translates to internal representation, executes against custom `ITableSource` implementations.

## Parser implementation recommendations

**For production systems**: Use Microsoft's official parser—it's complete, maintained, and handles all edge cases including semantic analysis with schema awareness.

**For custom implementations**, focus on these critical areas:

1. **Lexer design**: Handle four string literal types, timespan shorthand combinations, and the whitespace constraint on let statements
2. **Pipe operator**: Lowest precedence, chains entire operator outputs
3. **Context sensitivity**: Keywords like `where`, `project` are contextual—can be identifiers when quoted
4. **Type system**: Track schema propagation through operators for semantic validation
5. **Subquery contexts**: mv-apply, join, and evaluate have nested query contexts with different rules

**For SQL converters**, prioritize:

1. Build comprehensive function mapping tables covering all **200+ built-in functions**
2. Use CTE-based generation to preserve KQL's sequential semantics
3. Handle `mv-expand` and `dynamic` type operations per target SQL dialect
4. Identify unsupported features early and provide clear error messages
5. Test against Azure Data Explorer's `EXPLAIN` feature to validate translation correctness

The **most challenging conversions** are `mv-expand`, `mv-apply`, `make-series`, and `evaluate` plugins. Consider whether these features must be supported or can be flagged as unsupported in your use case.