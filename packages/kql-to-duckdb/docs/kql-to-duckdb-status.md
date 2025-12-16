# KQL to DuckDB Status

## Current State

- **Translator:** Implemented for all core operators (Project, Where, Summarize, Take, Limit, Extend, Sort, Distinct, Join, Top, Union)
- **Parser Integration:** Verified integration with `@fossiq/kql-parser`
- **Tests:** 113 passing tests covering translation scenarios
- **Package:** `@fossiq/kql-to-duckdb` production-ready for complex queries with comprehensive function support
- **Expression Support:** Full support for arithmetic, comparison, binary, string, math, and type conversion functions

## Implementation Phases

### Phase 1: Setup & Parsing (Completed)

- [x] Create package structure
- [x] Add dependency on `@fossiq/kql-parser`
- [x] Implement basic parser invocation
- [x] Verify with simple test

### Phase 2: Basic Translation (Completed)

- [x] Translate `source` (table name)
- [x] Translate `project` operator
- [x] Translate `where` operator
- [x] Translate `take`/`limit` operator

### Phase 3: Aggregations (Completed)

- [x] Translate `summarize` operator
- [x] Translate basic aggregation functions (`count`)
- [x] Translate other aggregation functions (`sum`, `avg`, `min`, `max`)

### Phase 4: Advanced Features (Completed)

- [x] Translate `extend`
- [x] Translate `sort`
- [x] Arithmetic expressions
- [x] Translate `distinct`
- [x] String expressions (`contains`, `startswith`, `endswith`, `matches`, `has`)

### Phase 5: Join Operations (Completed)

- [x] Translate `join` operator
- [x] Support all KQL join kinds (inner, leftouter, rightouter, fullouter, leftanti, rightanti, leftsemi, rightsemi)
- [x] Support multiple join conditions with AND logic
- [x] Integrate joins into operator pipelines

### Phase 6: Ranking Operations (Completed)

- [x] Translate `top` operator
- [x] Support top N without ordering
- [x] Support top N with ordering (ascending/descending)
- [x] Support default descending order for top operator
- [x] Integrate top into operator pipelines

### Phase 7: Set Operations (Completed)

- [x] Translate `union` operator
- [x] Support inner union (deduplication)
- [x] Support outer union (with ALL)
- [x] Support multiple tables in union
- [x] Handle union as query-level operation

### Phase 8: Complex String Functions (Completed)

- [x] Map KQL string functions to DuckDB equivalents
- [x] Support substring, tolower, toupper, length, trim functions
- [x] Support ltrim, rtrim, reverse, replace, split functions
- [x] Support indexof for string position searches
- [x] Integrate string functions in expressions

### Phase 9: Math Functions (Completed)

- [x] Map KQL math functions to DuckDB equivalents
- [x] Support basic functions (round, floor, ceil, abs, sqrt)
- [x] Support advanced functions (pow, log, log10, exp)
- [x] Support trigonometric functions (sin, cos, tan)
- [x] Integrate math functions in all expression contexts

### Phase 10: Type Conversion Functions (Completed)

- [x] Map KQL type conversion functions to SQL CAST
- [x] Support tostring, toint, todouble, tobool conversions
- [x] Support tolong, tofloat conversions
- [x] Support todatetime, totimespan conversions
- [x] Generate proper CAST expressions with type mapping

### Phase 11: DateTime Functions (Completed)

- [x] Translate `now()` function to SQL `NOW()`
- [x] Translate `ago()` function with timespan support
- [x] Support timespan literals in KQL format (1d, 1h, 30m, 45s)
- [x] Convert timespan to SQL INTERVAL with proper units
- [x] Support ago() in extend and where clauses
- [x] Handle complex datetime expressions

### Phase 12: Let Statement Support (Completed)

- [x] Parse and collect let statements from source file
- [x] Store variable values in variable map
- [x] Replace variable references with their expressions
- [x] Support numeric, string, and expression values in let statements
- [x] Support multiple let statements in sequence
- [x] Integrate let variables into all expression contexts
- [x] Support complex expressions with let variables in pipelines

### Phase 13: MV-Expand Operator (Completed)

- [x] Translate `mv-expand` operator to DuckDB `UNNEST()`
- [x] Support both `mv-expand` and `mvexpand` keyword variants
- [x] Support optional `limit` clause
- [x] Support optional `to typeof()` clause (type annotations)
- [x] Expand any column expression including function calls
- [x] Integrate into operator pipelines with CTE chaining

### Phase 14: Search Operator (Completed)

- [x] Translate `search` operator to SQL WHERE with LIKE conditions
- [x] Support searching in specific columns with `in (col1, col2)` syntax
- [x] Case-insensitive search using LOWER() functions
- [x] Substring matching with wildcard patterns
- [x] Support multiple columns with OR logic
- [x] Integrate search into operator pipelines

## Recent Completions

**Search Operator Implementation (Phase 14)**

- [x] Translate search to WHERE with column-specific LIKE conditions
- [x] Support case-insensitive pattern matching
- [x] Generate OR conditions for multiple column searches
- [x] Handle special characters in search terms
- [x] Added 6 test cases covering search scenarios
- [x] All 113 tests passing

**MV-Expand Operator Implementation (Phase 13)**

- [x] Translate multi-value expand to UNNEST cross join
- [x] Support column expressions and function calls in expand
- [x] Support limit parameter for result row limiting
- [x] Support type specification with to typeof() clause
- [x] Added 7 test cases covering all mv-expand scenarios
- [x] All 107 tests passing

**Let Statement Support Implementation (Phase 12)**

- [x] Process multiple statements in source file
- [x] Collect let statements before query execution
- [x] Implement variable substitution in expression translation
- [x] Replace identifier references with let variable values
- [x] Support let in all expression contexts (where, extend, etc.)
- [x] Added 7 test cases covering let statement scenarios
- [x] All 100 tests passing

**DateTime Functions Implementation (Phase 11)**

- [x] Translate `now()` function to SQL `NOW()`
- [x] Translate `ago()` function with timespan literals (1d, 1h, 30m, 45s)
- [x] Support ago() in both extend and where clauses
- [x] Proper timespan to INTERVAL conversion (day/hour/minute/second)
- [x] Complex datetime expressions (combining now and ago)
- [x] Added 8 test cases covering all datetime scenarios
- [x] All 93 tests passing

**Type Conversion Functions Implementation**

- Added 8 type conversion functions with proper CAST syntax
- Maps KQL types to SQL types: tostring→VARCHAR, toint→INTEGER, todouble→DOUBLE, etc.
- Supports todatetime→TIMESTAMP and totimespan→INTERVAL
- Added 9 test cases covering all conversion types
- Works in all expression contexts

**Math Functions Implementation**

- Added 10 math functions covering basic, advanced, and trigonometric operations
- Maps: round→ROUND, floor→FLOOR, ceil→CEIL, abs→ABS, sqrt→SQRT
- Also maps: pow→POW, log→LOG, log10→LOG10, exp→EXP, sin→SIN, cos→COS, tan→TAN
- Added 11 test cases with function combinations
- Enables sophisticated numerical computations

**Complex String Functions Implementation**

- Added function mapping layer for 10+ string functions
- Maps: substring→SUBSTR, tolower→LOWER, toupper→UPPER, indexof→STRPOS, split→STRING_SPLIT
- Also maps: length, trim, ltrim, rtrim, reverse, replace
- Works in all expression contexts (extend, where, project)
- Added 12 new test cases covering all string functions
- Enables sophisticated text processing in KQL queries

**Union Operator Implementation**

- Added support for `union` operator for combining multiple tables
- Maps KQL union kinds to SQL: UNION (inner/default) vs UNION ALL (outer)
- Supports union with source table and multiple additional tables
- Handles as query-level operation, not a pipe operator
- Added 5 new test cases covering all union scenarios
- Generates standard SQL set operations

**Top Operator Implementation**

- Added support for `top` operator for ranking/top-N queries
- Supports limiting with or without ordering by column
- Default order direction is DESC when not specified (KQL standard)
- Maps to SQL: `SELECT * FROM table ORDER BY column DESC LIMIT N`
- Added 6 new test cases covering all top operator variations
- Integrates seamlessly into operator pipelines via CTE chaining

**Join Operator Implementation**

- Added support for `join` operator with all KQL join kinds
- Maps join kinds to SQL equivalents: INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, LEFT ANTI, RIGHT ANTI, LEFT SEMI, RIGHT SEMI
- Supports multiple join conditions combined with AND logic
- Generates SQL: `SELECT * FROM left_table JOIN right_table ON condition1 AND condition2`
- Properly handles join conditions with table-qualified column names
- Added 11 new test cases covering all join types and scenarios
- Joins integrate seamlessly into operator pipelines via CTE chaining

**String Expression Support**

- Added support for string operations: `contains`, `startswith`, `endswith`, `matches`, `has`
- Maps to SQL equivalents: `LIKE` for substring operations, `REGEXP` for regex
- Translates `contains` to `LIKE '%' || value || '%'`
- Translates `startswith` to `LIKE value || '%'`
- Translates `endswith` to `LIKE '%' || value`
- Translates `matches` to `REGEXP` for regex patterns
- Added 5 new test cases

**Extend & Sort Operators Implementation**

- Added support for `extend` operator (adds computed columns while keeping existing ones)
- Added support for `sort`/`order by` operator with ascending/descending direction
- Implemented `ArithmeticExpression` support for binary operations (+, -, \*, /, %)
- Extended `translateExpression()` to handle arithmetic operations with proper parenthesization

**Distinct Operator Implementation**

- Added support for `distinct` operator for deduplication
- Supports distinct on all columns or specific columns
- Generates SQL: `SELECT DISTINCT <columns> FROM table`

**Core Translation Logic**

- Implemented `translator.ts` with AST traversal
- CTE-based pipeline generation (e.g. `WITH cte_0 AS (...) SELECT ...`)
- Full operator support: `where`, `project`, `take`, `limit`, `extend`, `sort`, `distinct`
- Expression translation: Binary, Comparison, Arithmetic, String, Literals

**Summarize Operator**

- Added support for `summarize` with `by` clause
- Implemented multiple aggregation functions (`count`, `sum`, `avg`, `min`, `max`)
- Handled grouping sets translation to SQL `GROUP BY`

**Parser Fixes**

- Patched `@fossiq/kql-parser` to handle wrapper nodes for operators, expressions, and literals
- Verified fix with `kql-to-duckdb` integration tests

## Test Coverage

**Total Tests:** 113 passing

**Coverage includes:**

- Simple table translation
- Where clause filtering
- Project column selection
- Take/Limit operators
- Multi-operator pipelines
- Summarize with all aggregation functions (count, sum, avg, min, max)
- Named aggregation results
- Extend with single and multiple columns
- Extend with arithmetic expressions
- Sort ascending and descending
- Sort with multiple columns
- Sort with default direction
- Complex multi-operator pipelines
- Distinct all columns
- Distinct specific columns
- Distinct in pipelines
- String contains operation
- String startswith operation
- String endswith operation
- String matches (regex) operation
- String has operation
- Inner join
- Left outer join
- Right outer join
- Full outer join
- Left anti join
- Right anti join
- Left semi join
- Right semi join
- Join with multiple conditions
- Join in multi-operator pipeline
- Default join type (inner)
- Top without ordering
- Top with ascending order
- Top with descending order
- Top with default descending order
- Top in multi-operator pipeline
- Complex pipeline with top
- Inner union (deduplication)
- Outer union with ALL
- Default union as inner
- Union with multiple tables
- Union with all duplicate rows
- Substring function
- Tolower function
- Toupper function
- Indexof function
- Length function
- Trim function
- Ltrim function
- Rtrim function
- Replace function
- Reverse function
- Split function
- Complex string function expressions
- Round, floor, ceil functions
- Abs, sqrt, pow functions
- Log, log10, exp functions
- Trigonometric functions (sin, cos, tan)
- Tostring, toint, todouble conversions
- Tobool, tolong, tofloat conversions
- Todatetime, totimespan conversions
- Now function
- Ago with day, hour, minute, second units
- Ago in where clause
- Complex datetime expressions
- Now and ago in pipelines
- Let with number literals
- Let with string literals
- Multiple let statements
- Let with expressions
- Let in where clauses
- Let with string comparisons
- Let in complex pipelines
- MV-expand simple column expansion
- MV-expand with limit clause
- MV-expand with type specifications
- MV-expand in multi-operator pipelines
- MV-expand with function calls
- Search in single column
- Search in multiple columns
- Search with special characters
- Case-insensitive search matching
- Search in multi-operator pipelines
- Search with multiple column conditions

## Architecture

**CTE-Based Pipeline Generation**

- Each operator translates to a SQL `SELECT` statement
- Operators chain via Common Table Expressions (CTEs)
- Example: `Table | where X > 10 | project Y`
  ```sql
  WITH cte_0 AS (SELECT * FROM Table WHERE X > 10)
  SELECT * FROM cte_0
  ```
  → Then chains to: `WITH ... cte_1 AS (SELECT Y FROM cte_0) SELECT * FROM cte_1`

**Expression Translation Strategy**

- Recursive descent through expression tree
- Each expression type has dedicated handler
- Maintains operator precedence through parenthesization
- Supports nested function calls and expressions

## Supported Operators

| Operator       | Status      | Example                                          |
| -------------- | ----------- | ------------------------------------------------ |
| `where`        | ✅ Complete | `Table \| where Col > 10`                        |
| `project`      | ✅ Complete | `Table \| project Col1, Col2`                    |
| `extend`       | ✅ Complete | `Table \| extend NewCol = Col * 2`               |
| `summarize`    | ✅ Complete | `Table \| summarize sum(X) by Category`          |
| `sort`         | ✅ Complete | `Table \| sort by Col desc`                      |
| `distinct`     | ✅ Complete | `Table \| distinct Col1, Col2`                   |
| `take`/`limit` | ✅ Complete | `Table \| take 5`                                |
| `join`         | ✅ Complete | `Table1 \| join kind=inner Table2 on Col == Col` |
| `top`          | ✅ Complete | `Table \| top 10 by Score desc`                  |
| `union`        | ✅ Complete | `Table1 \| union kind=inner Table2, Table3`      |
| `mv-expand`    | ✅ Complete | `Table \| mv-expand Tags limit 10`               |
| `search`       | ✅ Complete | `Table \| search in (Name, Email) "admin"`       |

## Expression Support

- ✅ Arithmetic (+, -, \*, /, %)
- ✅ Comparison (==, !=, >, <, >=, <=)
- ✅ Binary (and, or)
- ✅ String (contains, startswith, endswith, matches, has)
- ✅ Function calls (with aggregations)
- ✅ Literals (string, number, boolean, null)

## Next Steps

Potential future enhancements:

- [x] DateTime functions (`now()`, `ago()`, `todatetime()`) - Phase 11
- [x] `let` statement support - Phase 12
- [x] `mv_expand` operator - Phase 13
- [x] `search` operator - Phase 14
- [ ] Subqueries
- [ ] `count` operator

## Known Limitations

### Parse Operator

The KQL `parse` operator is **not supported** due to fundamental architectural constraints:

1. **Dynamic schema** - Parse creates new columns based on regex groups at runtime. SQL requires predefined schema.
2. **Complex patterns** - Requires evaluating regex with named capture groups, not a standard SQL operation.
3. **Column materialization** - Would need to execute regex patterns and materialize results within SQL, which most databases don't support well.
4. **No SQL equivalent** - Standard SQL lacks native support for pattern-based column extraction.

Users should pre-process data with application logic or use DuckDB's `regexp_extract()` for simpler cases.

## Production Readiness

The translator now supports a comprehensive set of KQL operators and is suitable for production use with:

- Basic data filtering and transformation (where, project, extend)
- Aggregations and grouping (summarize with multiple aggregation functions)
- Result ordering (sort/order by)
- Top-N ranking queries (top with optional ordering)
- Deduplication (distinct)
- String pattern matching and manipulation
- Multi-table operations with joins (all 8 KQL join types)
- Multi-operator pipelines with proper CTE generation

All core functionality is complete and well-tested with 113 passing integration tests covering:

- 11 core operators (where, project, extend, summarize, sort, distinct, take/limit, top, union, mv-expand, search)
- 1 advanced operator (join with 8 different join kinds)
- 11 expression types (arithmetic, comparison, binary, string, functions, string functions, math functions, type conversions, datetime functions, literals)
- 35+ mapped functions: 10+ string, 10+ math, 8 type conversions, 2 datetime
- Complex multi-operator pipelines with proper chaining
- Set operations (union with inner/outer variants)
