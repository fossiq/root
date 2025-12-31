# KQL Parser Implementation Guide

**Scope:** Data exploration queries only — KQL-to-DuckDB SQL conversion  
**Excludes:** Management commands, ingestion, DDL, schema modification

---

## Compatibility Legend

| Symbol | Status | Meaning |
|--------|--------|---------|
| ✅ | FULL | Direct DuckDB conversion |
| ⚠️ | PARTIAL | Conversion with limitations |
| ❌ | NONE | No DuckDB equivalent |
| 🚫 | UNSUPPORTED | Out of scope (data modification) |

**Conversion Notes:**
- Pipe chains → nested SELECTs or CTEs
- `dynamic` type → JSON extension
- `has` operators → regex with `\b` (no term indexing; performance differs)
- Time series, graph, plugins → no equivalents

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Lexical Structure](#2-lexical-structure)
3. [Data Types](#3-data-types)
4. [Literals](#4-literals)
5. [Operators](#5-operators)
6. [Statements](#6-statements)
7. [Tabular Operators](#7-tabular-operators)
8. [Scalar Functions](#8-scalar-functions)
9. [Aggregation Functions](#9-aggregation-functions)
10. [Window Functions](#10-window-functions)
11. [Plugins](#11-plugins)
12. [Special Constructs](#12-special-constructs)
13. [Schema Entities](#13-schema-entities)
14. [Query Parameters](#14-query-parameters)
15. [Test Cases](#15-test-cases)

---

## 1. Introduction

### 1.1 Language Overview

KQL is a read-only query language. Data flows through operators via pipe (`|`).

**Key characteristics:**
- Case-sensitive (table names, column names, operators, functions)
- Statement separation: semicolon (`;`)
- Read-only: queries never modify data

### 1.2 Query Structure

```
[let statement ;] ... [set statement ;] ... TabularExpression
```

### 1.3 Parser Notes

- Unicode identifiers supported
- Comments: `//` single-line, `/* */` multi-line
- Whitespace insignificant except in strings
- Reserved words as identifiers: `['keyword']` or `["keyword"]`

### 1.4 🚫 UNSUPPORTED: Management Commands

This guide covers **query language only**. The following are out of scope:

| Category | Examples |
|----------|----------|
| **Schema DDL** | `.create table`, `.drop table`, `.alter column`, `.create function` |
| **Ingestion** | `.ingest`, `.set`, `.append`, `.set-or-append`, `.set-or-replace` |
| **Permissions** | `.add`, `.drop` (principals, roles) |
| **Cluster ops** | `.show`, `.create database`, `.alter database` |

These commands modify data or schema. Parse and reject with clear error.

---

## 2. Lexical Structure

### 2.1 Identifiers ✅

```ebnf
identifier = letter { letter | digit | '_' }
           | '[' quoted_identifier ']'
```

**Rules:** Start with letter/underscore, contain letters/digits/underscores, max 1024 chars. Quote reserved words: `['where']`.

**DuckDB:** Direct support. Quote with `"identifier"`.

### 2.2 Comments ✅

| KQL | DuckDB |
|-----|--------|
| `// comment` | `-- comment` |
| `/* comment */` | `/* comment */` |

Nested `/* */` not supported.

### 2.3 String Literals ⚠️

| Prefix | Description | DuckDB |
|--------|-------------|--------|
| (none) | Escape sequences processed | ✅ Single quotes: `'hello'` |
| `@` | Verbatim (no escapes) | ⚠️ Double backslashes |
| `h` | Obfuscated (hidden in traces) | ⚠️ Converts to regular string |

**Escape sequences:** `\n \r \t \\ \' \" \0 \xHH \uHHHH`

**DuckDB notes:**
- KQL double quotes → SQL single quotes: `"hello"` → `'hello'`
- Verbatim `@"C:\path"` → `'C:\\path'`
- `\x` and `\u` escapes: expand to literal chars

### 2.4 Numeric Literals ✅

All numeric formats directly supported: integers, hex (`0xFF`), reals, scientific notation.

- `real(null)`, `double(expr)` → `CAST(expr AS DOUBLE)` or `NULL::DOUBLE`

### 2.5 Timespan Literals ⚠️

| KQL | DuckDB |
|-----|--------|
| `1d` | `INTERVAL 1 DAY` |
| `2h` | `INTERVAL 2 HOUR` |
| `30m` | `INTERVAL 30 MINUTE` |
| `45s` | `INTERVAL 45 SECOND` |
| `500ms` | `INTERVAL 500 MILLISECOND` |
| `1d2h3m` | Sum of INTERVALs |

**Units:** `d` (day), `h` (hour), `m` (minute), `s` (second), `ms` (millisecond), `microsecond`, `tick` (0.1μs)

### 2.6 DateTime Literals ✅

`datetime(2024-01-15T10:30:00Z)` → `TIMESTAMP '2024-01-15 10:30:00+00'`

ISO 8601 formats: `YYYY-MM-DD`, with time `THH:MM:SS`, fractional `.ffffff`, timezone `Z` or `±HH:MM`.

### 2.7 GUID Literals ✅

`guid(74be27de-1e4e-49d9-b579-fe0b331d3642)` → `'74be27de-1e4e-49d9-b579-fe0b331d3642'::UUID`

### 2.8 Boolean Literals ✅

`true`, `false` → Direct support. `bool(expr)` → `CAST(expr AS BOOLEAN)`.

### 2.9 Dynamic Literals ⚠️

JSON-like flexible type containing objects, arrays, or KQL-specific types.

| KQL | DuckDB |
|-----|--------|
| `dynamic([1,2,3])` | `[1,2,3]::JSON` |
| `dynamic({"k":"v"})` | `json('{"k":"v"}')` |
| `d.key` | `d->>'key'` |
| `d[0]` | `d->>0` |

**Limitation:** KQL datetime/timespan in dynamic must serialize to strings or epoch values.

---

## 3. Data Types

### 3.1 Type Mapping

| KQL | DuckDB |
|-----|--------|
| `bool` | ✅ `BOOLEAN` |
| `datetime` | ✅ `TIMESTAMP` / `TIMESTAMPTZ` |
| `decimal` | ✅ `DECIMAL(38,9)` |
| `dynamic` | ⚠️ `JSON` |
| `guid` | ✅ `UUID` |
| `int` | ✅ `INTEGER` |
| `long` | ✅ `BIGINT` |
| `real` / `double` | ✅ `DOUBLE` |
| `string` | ✅ `VARCHAR` |
| `timespan` | ⚠️ `INTERVAL` |

### 3.2 Null Handling ✅

- All types except `string` support null (string uses empty `""`)
- Null literal: `type(null)` (e.g., `int(null)`)
- `isnull(x)` → `x IS NULL`
- `isnotnull(x)` → `x IS NOT NULL`

**Semantic difference:** KQL `x == null` returns `false`; SQL `x = NULL` returns `NULL`. Use `IS NOT DISTINCT FROM` for KQL semantics.

### 3.3 Type Conversions ✅

| KQL | DuckDB |
|-----|--------|
| `tobool(x)` | `CAST(x AS BOOLEAN)` |
| `todatetime(x)` | `CAST(x AS TIMESTAMP)` |
| `todouble(x)` / `toreal(x)` | `CAST(x AS DOUBLE)` |
| `toint(x)` | `CAST(x AS INTEGER)` |
| `tolong(x)` | `CAST(x AS BIGINT)` |
| `tostring(x)` | `CAST(x AS VARCHAR)` |
| `totimespan(x)` | ⚠️ Parse to `INTERVAL` |

---

## 4. Literals

| Type | Examples |
|------|----------|
| bool | `true`, `false`, `bool(null)` |
| int | `42`, `0xFF`, `-1` |
| long | `9223372036854775807` |
| real | `3.14`, `1e10`, `real(null)` |
| string | `"hello"`, `'world'`, `@"verbatim"`, `h"obfuscated"` |
| datetime | `datetime(2024-01-15)` |
| timespan | `1d`, `2h30m`, `timespan(1h)` |
| guid | `guid(74be27de-1e4e-49d9-b579-fe0b331d3642)` |
| dynamic | `dynamic([1,2,3])`, `dynamic({"a":1})` |

---

## 5. Operators

### 5.1 Arithmetic ✅

| Op | DuckDB | Notes |
|----|--------|-------|
| `+` `-` `*` `/` | Same | |
| `%` | `%` | ⚠️ KQL always positive; DuckDB follows dividend sign. Use `((x % y) + y) % y` |

**Type coercion:** real wins; integer ops yield long; datetime-datetime = interval.

### 5.2 Comparison ⚠️

| KQL | DuckDB |
|-----|--------|
| `==` | `=` |
| `!=` | `<>` |
| `<` `<=` `>` `>=` | Same |
| `=~` (case-insensitive) | `LOWER(a) = LOWER(b)` |
| `!~` | `LOWER(a) <> LOWER(b)` |

### 5.3 Logical ✅

`and` → `AND`, `or` → `OR`, `not` → `NOT`. Short-circuit evaluation applies.

### 5.4 String Operators ⚠️

| KQL | Case | DuckDB |
|-----|------|--------|
| `contains` | No | `ILIKE '%' \|\| x \|\| '%'` |
| `contains_cs` | Yes | `LIKE '%' \|\| x \|\| '%'` |
| `startswith` | No | `ILIKE x \|\| '%'` |
| `startswith_cs` | Yes | `starts_with()` |
| `endswith` | No | `ILIKE '%' \|\| x` |
| `endswith_cs` | Yes | `ends_with()` |
| `has` | No | ⚠️ `regexp_matches(col, '\b' \|\| x \|\| '\b', 'i')` |
| `has_cs` | Yes | ⚠️ `regexp_matches(col, '\b' \|\| x \|\| '\b')` |
| `hasprefix` | No | ⚠️ `regexp_matches(col, '\b' \|\| x, 'i')` |
| `hassuffix` | No | ⚠️ `regexp_matches(col, x \|\| '\b', 'i')` |
| `has_all` | No | Multiple `has` with `AND` |
| `has_any` | No | Multiple `has` with `OR` |
| `in` | Yes | `IN (...)` |
| `in~` | No | `LOWER(x) IN (...)` |
| `matches regex` | Yes | `regexp_matches(col, pattern)` |

**Critical:** `has` uses term indexing in Kusto for performance. DuckDB regex has no such optimization. Negated forms use `NOT`.

### 5.5 Between ✅

`x between (a .. b)` → `x BETWEEN a AND b`

### 5.6 Bitwise ✅

| KQL | DuckDB |
|-----|--------|
| `binary_and(a, b)` | `a & b` |
| `binary_or(a, b)` | `a \| b` |
| `binary_xor(a, b)` | `xor(a, b)` |
| `binary_not(a)` | `~a` |
| `binary_shift_left(a, n)` | `a << n` |
| `binary_shift_right(a, n)` | `a >> n` |

### 5.7 IPv4 Operators ⚠️

`has_ipv4`, `has_ipv4_prefix`, `has_any_ipv4` → Convert to regex or LIKE patterns. DuckDB's `inet` extension available but no direct text-search functions.
| `has_cs` | Term match | Yes | ⚠️ Regex without 'i' flag |
| `!has_cs` | No term match | Yes | ⚠️ `NOT regexp_matches(...)` |
| `hasprefix` | Term prefix | No | ⚠️ Regex: `regexp_matches(col, '\b' || x, 'i')` |
| `!hasprefix` | No term prefix | No | ⚠️ `NOT regexp_matches(...)` |
| `hasprefix_cs` | Term prefix | Yes | ⚠️ Regex without 'i' flag |
---

## 6. Statements

### 6.1 Let Statement ⚠️

```ebnf
let_statement = 'let' id '=' expr ';'
              | 'let' id '=' '(' params ')' '{' expr '}' ';'
```

| Use Case | DuckDB |
|----------|--------|
| Scalar binding | CTE: `WITH x AS (SELECT 42 AS value)` |
| Tabular binding | CTE: `WITH T AS (SELECT ...)` |
| Scalar function | Inline expression or `CREATE MACRO` |
| Tabular function | CTE with parameter substitution |
| `materialize()` | `WITH ... AS MATERIALIZED (...)` |

### 6.2 Set Statement ❌

Query options (`notruncation`, `querytrace`) are Kusto-specific. Strip from output. Use `LIMIT` for `truncationmaxrecords`.

### 6.3 Query Parameters ⚠️

`declare query_parameters(...)` → Prepared statement parameters (`$1`, `$2`) or `SET VARIABLE`.

### 6.4 Tabular Expression ✅

`T | op1 | op2 | op3` → Nested SELECTs or CTEs:
```sql
WITH step1 AS (SELECT ... FROM T WHERE ...),
     step2 AS (SELECT ... FROM step1 ...)
SELECT * FROM step2
```

---

## 7. Tabular Operators

### 7.1 Operator Overview

| Category | Operators | DuckDB |
|----------|-----------|--------|
| **Filter** | `where`, `take`, `limit`, `sample`, `distinct`, `top` | ✅ |
| **Project** | `project`, `project-away`, `project-keep`, `project-rename`, `extend` | ✅ |
| **Sort** | `sort`, `order`, `top` | ✅ |
| **Aggregate** | `summarize`, `count` | ✅ |
| **Join** | `join`, `lookup`, `union` | ✅ |
| **Expand** | `mv-expand`, `mv-apply` | ⚠️ UNNEST/LATERAL |
| **Parse** | `parse`, `extract` | ⚠️ regex |
| **Serialize** | `serialize` | ✅ Implicit |
| **Time Series** | `make-series` | ⚠️ Complex |
| **Branch** | `fork`, `partition`, `facet` | ❌ Multiple result sets |
| **Graph** | `make-graph`, `graph-match` | ❌ None |

### 7.2 Operators

#### where / filter ✅
`T | where x > 10` → `SELECT * FROM T WHERE x > 10`

#### project ✅
| KQL | DuckDB |
|-----|--------|
| `project x, y` | `SELECT x, y` |
| `project x, new = x*2` | `SELECT x, x*2 AS new` |
| `project-away col` | `SELECT * EXCLUDE (col)` |
| `project-rename new = old` | `SELECT old AS new, ...` |

#### extend ✅
`T | extend new = x*2` → `SELECT *, x*2 AS new FROM T`

#### summarize ✅
`T | summarize count() by State` → `SELECT State, count(*) FROM T GROUP BY State`

Hints (e.g., `hint.shufflekey`) are stripped.

#### join ✅

| Kind | DuckDB |
|------|--------|
| `inner` | `INNER JOIN` |
| `innerunique` | ⚠️ `INNER JOIN` + `DISTINCT ON` |
| `leftouter` | `LEFT JOIN` |
| `rightouter` | `RIGHT JOIN` |
| `fullouter` | `FULL OUTER JOIN` |
| `leftanti` | `LEFT JOIN ... WHERE right.key IS NULL` or `NOT EXISTS` |
| `leftsemi` | `WHERE EXISTS (...)` |

`$left.col`, `$right.col` → Use table aliases. Hints stripped.
#### union ✅
`T1 | union T2` → `SELECT * FROM T1 UNION ALL SELECT * FROM T2`

`withsource=TableName` → Add literal column. Wildcard patterns (`Table*`) unsupported.

#### mv-expand ⚠️
`T | mv-expand arr` → `SELECT t.*, u.* FROM T t, UNNEST(t.arr) AS u`

`with_itemindex=idx` → `UNNEST(...) WITH ORDINALITY`

#### mv-apply ⚠️
Requires `LATERAL` subquery with aggregation.

#### parse ⚠️
Convert pattern to regex with capture groups:
```sql
-- T | parse Message with "IP=" IP ", Port=" Port:int
SELECT *, 
  regexp_extract(Message, 'IP=([^,]+), Port=(\d+)', 1) AS IP,
  CAST(regexp_extract(Message, 'IP=([^,]+), Port=(\d+)', 2) AS INTEGER) AS Port
FROM T
```

#### make-series ⚠️
Complex. Use `generate_series()` + `LEFT JOIN` + `list_agg()` pattern to produce array columns.

#### sort / order ✅
`T | sort by x desc` → `ORDER BY x DESC`

#### top ✅
`T | top 10 by x desc` → `ORDER BY x DESC LIMIT 10`

#### distinct ✅
`T | distinct x, y` → `SELECT DISTINCT x, y FROM T`

#### take / limit ✅
`T | take 100` → `LIMIT 100`

#### sample ⚠️
`T | sample 100` → `USING SAMPLE 100 ROWS` or `ORDER BY random() LIMIT 100`

#### range ✅
`range x from 1 to 10 step 1` → `SELECT generate_series(1, 10, 1) AS x`

#### datatable ✅
`datatable(x:int, y:string)[1,"a",2,"b"]` → `SELECT * FROM (VALUES (1,'a'),(2,'b')) AS t(x,y)`

#### print ✅
`print x=42, y="hi"` → `SELECT 42 AS x, 'hi' AS y`

#### getschema ⚠️
`T | getschema` → `DESCRIBE T` or `PRAGMA table_info('T')`

#### render ❌
Visualization. Strip from query; handle client-side.

#### invoke ⚠️
Inline the function body with parameter substitution.

#### lookup ✅
Equivalent to JOIN.

#### as ⚠️
CTE naming. `hint.materialized` → `MATERIALIZED` keyword in CTE.

#### serialize ✅
Implicit in SQL. Row ordering preserved after ORDER BY.

#### partition ⚠️
Window functions with `PARTITION BY`, or LATERAL subquery per group.

#### fork ❌
Multiple result sets. Run as separate queries.

#### find / search ⚠️
Convert to UNION of searches across tables. Full-text requires column enumeration.

#### externaldata ⚠️
`read_csv()`, `read_json()`, `read_parquet()` with httpfs extension.

#### facet ❌
Multiple result sets. Separate grouped queries.

#### scan ❌
Stateful row-by-row pattern matching not supported.

---

## 8. Scalar Functions

### 8.1 Binary Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `binary_and(a, b)` | Bitwise AND | `a & b` |
| `binary_or(a, b)` | Bitwise OR | `a | b` |
| `binary_xor(a, b)` | Bitwise XOR | `xor(a, b)` |
| `binary_not(a)` | Bitwise NOT | `~a` |
| `binary_shift_left(a, n)` | Left shift | `a << n` |
| `binary_shift_right(a, n)` | Right shift | `a >> n` |
| `bitset_count_ones(n)` | Count set bits | `bit_count(n)` |

### 8.2 Conversion Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `tobool(expr)` | Convert to bool | `CAST(expr AS BOOLEAN)` |
| `todatetime(expr)` | Convert to datetime | `CAST(expr AS TIMESTAMP)` |
| `todecimal(expr)` | Convert to decimal | `CAST(expr AS DECIMAL)` |
| `todouble(expr)` / `toreal(expr)` | Convert to real | `CAST(expr AS DOUBLE)` |
| `toguid(expr)` | Convert to GUID | `CAST(expr AS UUID)` |
| `toint(expr)` | Convert to int | `CAST(expr AS INTEGER)` |
| `tolong(expr)` | Convert to long | `CAST(expr AS BIGINT)` |
| `tostring(expr)` | Convert to string | `CAST(expr AS VARCHAR)` |
| `totimespan(expr)` | Convert to timespan | ⚠️ Parse to `INTERVAL` |

### 8.3 DateTime Functions ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `now([offset])` | Current UTC time | ✅ `current_timestamp` or `now()` |
| `ago(timespan)` | Past time relative to now | ✅ `current_timestamp - INTERVAL '...'` |
| `datetime_add(part, amount, dt)` | Add to datetime | ✅ `dt + INTERVAL '...'` or `date_add(dt, ...)` |
| `datetime_diff(part, dt1, dt2)` | Difference in units | ✅ `date_diff('part', dt1, dt2)` |
| `datetime_part(part, dt)` | Extract part | ✅ `date_part('part', dt)` |
| `datetime_local_to_utc(dt, tz)` | Local to UTC | ⚠️ `timezone(tz, dt)` |
| `datetime_utc_to_local(dt, tz)` | UTC to local | ⚠️ `timezone(tz, dt)` |
| `startofday(dt)` | Start of day | ✅ `date_trunc('day', dt)` |
| `endofday(dt)` | End of day | ✅ `date_trunc('day', dt) + INTERVAL '1 day' - INTERVAL '1 microsecond'` |
| `startofweek(dt)` | Start of week | ✅ `date_trunc('week', dt)` |
| `endofweek(dt)` | End of week | ✅ Similar pattern |
| `startofmonth(dt)` | Start of month | ✅ `date_trunc('month', dt)` |
| `endofmonth(dt)` | End of month | ✅ `last_day(dt)` or pattern |
| `startofyear(dt)` | Start of year | ✅ `date_trunc('year', dt)` |
| `endofyear(dt)` | End of year | ✅ Similar pattern |
| `dayofweek(dt)` | Day of week (timespan) | ⚠️ `dayofweek(dt)` returns int 0-6 |
| `dayofmonth(dt)` | Day of month (int) | ✅ `day(dt)` |
| `dayofyear(dt)` | Day of year (int) | ✅ `dayofyear(dt)` |
| `weekofyear(dt)` | Week of year | ✅ `weekofyear(dt)` |
| `monthofyear(dt)` | Month (1-12) | ✅ `month(dt)` |
| `getyear(dt)` | Year | ✅ `year(dt)` |
| `hourofday(dt)` | Hour (0-23) | ✅ `hour(dt)` |
| `format_datetime(dt, format)` | Format as string | ⚠️ `strftime(dt, format)` (different format codes) |
| `format_timespan(ts, format)` | Format timespan | ⚠️ Manual formatting |
| `make_datetime(y, m, d, ...)` | Create datetime | ✅ `make_timestamp(y, m, d, h, min, s)` |
| `make_timespan(...)` | Create timespan | ⚠️ `INTERVAL` expression |
| `unixtime_seconds_todatetime(s)` | Unix epoch to datetime | ✅ `to_timestamp(s)` |
| `unixtime_milliseconds_todatetime(ms)` | Unix ms to datetime | ✅ `to_timestamp(ms/1000.0)` |
| `unixtime_microseconds_todatetime(us)` | Unix μs to datetime | ✅ `to_timestamp(us/1000000.0)` |
| `unixtime_nanoseconds_todatetime(ns)` | Unix ns to datetime | ✅ `to_timestamp(ns/1000000000.0)` |

### 8.4 Dynamic/Array Functions ⚠️

**DuckDB Compatibility Summary:**
- ✅ Array operations: `list_concat`, `list_reverse`, `list_sort`, `array_length`
- ⚠️ Bag/JSON operations: Use JSON extension (`json_extract`, `json_keys`, etc.)
- ⚠️ Set operations: `list_distinct`, manual intersection/difference
- ❌ Some KQL-specific functions require custom implementation

| Function | Description | DuckDB |
|----------|-------------|
| `array_concat(arr, ...)` | Concatenate arrays |
| `array_iff(cond, if_true, if_false)` | Element-wise iff |
| `array_index_of(arr, value)` | Find index |
| `array_length(arr)` | Array length |
| `array_reverse(arr)` | Reverse array |
| `array_rotate_left(arr, n)` | Rotate left |
| `array_rotate_right(arr, n)` | Rotate right |
| `array_shift_left(arr, n)` | Shift left |
| `array_shift_right(arr, n)` | Shift right |
| `array_slice(arr, start, end)` | Extract slice |
| `array_sort_asc(arr)` | Sort ascending |
| `array_sort_desc(arr)` | Sort descending |
| `array_split(arr, indices)` | Split array |
| `array_sum(arr)` | Sum elements |
| `bag_has_key(bag, key)` | Check key exists |
| `bag_keys(bag)` | Get all keys |
| `bag_merge(bag1, bag2)` | Merge bags |
| `bag_pack(k1, v1, ...)` | Create bag |
| `bag_pack_columns(col, ...)` | Pack columns |
| `bag_remove_keys(bag, keys)` | Remove keys |
| `bag_set_key(bag, key, value)` | Set key |
| `pack_all()` | Pack all columns |
| `pack_array(v1, v2, ...)` | Create array |
| `repeat(value, count)` | Repeat value |
| `set_difference(arr1, arr2)` | Set difference |
| `set_has_element(arr, elem)` | Element in set |
| `set_intersect(arr1, arr2)` | Set intersection |
| `set_union(arr1, arr2)` | Set union |
| `treepath(dynamic)` | Enumerate paths |
| `zip(arr1, arr2, ...)` | Zip arrays |
| `jaccard_index(arr1, arr2)` | Jaccard index |

### 8.5 String Functions ⚠️

**DuckDB Compatibility Summary:**
- ✅ Basic: `length`, `concat`, `lower`, `upper`, `substring`, `trim`, `ltrim`, `rtrim`, `reverse`, `replace`
- ✅ Search: `position`, `instr`, `contains`
- ⚠️ Regex: `regexp_extract`, `regexp_replace` (different syntax from KQL)
- ⚠️ Parse functions: JSON via `json_extract`; URL/CSV require manual parsing
- ⚠️ Base64: `base64`, `from_base64`
- ❌ Some specialized parsers (command_line, version) require custom implementation

| Function | Description | DuckDB |
|----------|-------------|
| `strlen(s)` | String length |
| `strcat(s1, s2, ...)` | Concatenate |
| `strcat_delim(delim, s1, ...)` | Concat with delimiter |
| `strcmp(s1, s2)` | Compare strings |
| `strrep(s, n)` | Repeat string |
| `substring(s, start, [length])` | Extract substring |
| `tolower(s)` | To lowercase |
| `toupper(s)` | To uppercase |
| `trim(regex, s)` | Trim both ends |
| `trim_start(regex, s)` | Trim start |
| `trim_end(regex, s)` | Trim end |
| `split(s, delim)` | Split string |
| `reverse(s)` | Reverse string |
| `replace_string(s, old, new)` | Replace string |
| `replace_strings(s, olds, news)` | Replace multiple |
| `replace_regex(s, regex, rewrite)` | Regex replace |
| `extract(regex, group, s)` | Extract match |
| `extract_all(regex, s)` | Extract all matches |
| `extract_json(path, s)` | Extract JSON value |
| `indexof(s, substr)` | Find substring |
| `countof(s, substr)` | Count occurrences |
| `parse_json(s)` | Parse JSON |
| `parse_csv(s)` | Parse CSV |
| `parse_url(s)` | Parse URL |
| `parse_urlquery(s)` | Parse URL query |
| `parse_command_line(s)` | Parse command line |
| `parse_version(s)` | Parse version |
| `parse_ipv4(s)` | Parse IPv4 |
| `parse_ipv4_mask(s, prefix)` | Parse IPv4 with mask |
| `parse_ipv6(s)` | Parse IPv6 |
| `parse_ipv6_mask(s, prefix)` | Parse IPv6 with mask |
| `base64_encode_tostring(s)` | Base64 encode |
| `base64_decode_tostring(s)` | Base64 decode |
| `base64_encode_fromguid(g)` | GUID to base64 |
| `base64_decode_toarray(s)` | Base64 to array |
| `base64_decode_toguid(s)` | Base64 to GUID |
| `url_encode(s)` | URL encode |
| `url_decode(s)` | URL decode |
| `tohex(n)` | To hexadecimal |
| `translate(s, from, to)` | Character translation |
| `isempty(s)` | Is empty string |
| `isnotempty(s)` | Is not empty |
| `has_any_index(s, arr)` | Find any match index |
| `punycode_from_string(s)` | To punycode |
| `punycode_to_string(s)` | From punycode |

### 8.6 Mathematical Functions ✅

**DuckDB Compatibility Summary:**
- ✅ Trigonometric: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `cot`
- ✅ Logarithmic: `ln` (natural), `log2`, `log10`, `exp`
- ✅ Rounding: `round`, `ceil`/`ceiling`, `floor`, `trunc`
- ✅ Other: `abs`, `sign`, `sqrt`, `pow`/`power`, `pi`
- ⚠️ Statistical: `gamma`, `erf` via extensions; `welch_test` not available
- ⚠️ `exp2`, `exp10`: Use `pow(2, n)`, `pow(10, n)`

| Function | Description | DuckDB |
|----------|-------------|
| `abs(n)` | Absolute value |
| `acos(n)` | Arccosine |
| `asin(n)` | Arcsine |
| `atan(n)` | Arctangent |
| `atan2(y, x)` | Two-argument arctangent |
| `cos(n)` | Cosine |
| `sin(n)` | Sine |
| `tan(n)` | Tangent |
| `cot(n)` | Cotangent |
| `degrees(radians)` | To degrees |
| `radians(degrees)` | To radians |
| `exp(n)` | e^n |
| `exp2(n)` | 2^n |
| `exp10(n)` | 10^n |
| `log(n)` | Natural log |
| `log2(n)` | Log base 2 |
| `log10(n)` | Log base 10 |
| `pow(base, exp)` | Power |
| `sqrt(n)` | Square root |
| `pi()` | π constant |
| `sign(n)` | Sign (-1, 0, 1) |
| `round(n, [precision])` | Round |
| `ceiling(n)` | Ceiling |
| `floor(n)` | Floor |
| `rand([n])` | Random number |
| `range(start, stop, step)` | Generate array |
| `gamma(n)` | Gamma function |
| `loggamma(n)` | Log gamma |
| `beta_cdf(x, a, b)` | Beta CDF |
| `beta_inv(p, a, b)` | Inverse beta |
| `beta_pdf(x, a, b)` | Beta PDF |
| `erf(n)` | Error function |
| `erfc(n)` | Complementary error |
| `welch_test(m1, m2, s1, s2, n1, n2)` | Welch t-test |
| `isfinite(n)` | Is finite |
| `isinf(n)` | Is infinite |
| `isnan(n)` | Is NaN |
| `not(b)` | Logical not |

### 8.7 Rounding Functions ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `bin(value, roundTo)` | Round down to bin | ⚠️ `time_bucket` for time; `floor(value/roundTo)*roundTo` for numeric |
| `bin_at(value, size, anchor)` | Bin with anchor | ⚠️ Manual calculation with anchor offset |
| `ceiling(n)` | Smallest integer ≥ n | ✅ `ceil(n)` |
| `floor(n)` | Largest integer ≤ n | ✅ `floor(n)` |
| `round(n, [precision])` | Round to precision | ✅ `round(n, precision)` |

### 8.8 Conditional Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `case(cond1, val1, ..., else)` | Multi-case conditional | ✅ `CASE WHEN cond1 THEN val1 ... ELSE else END` |
| `iff(cond, ifTrue, ifFalse)` | If-then-else | ✅ `IF(cond, ifTrue, ifFalse)` or `CASE` |
| `iif(cond, ifTrue, ifFalse)` | Alias for iff | ✅ Same as above |
| `coalesce(v1, v2, ...)` | First non-null | ✅ `COALESCE(v1, v2, ...)` |
| `max_of(v1, v2, ...)` | Maximum | ✅ `GREATEST(v1, v2, ...)` |
| `min_of(v1, v2, ...)` | Minimum | ✅ `LEAST(v1, v2, ...)` |

### 8.9 Type Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `gettype(expr)` | Get runtime type | ✅ `typeof(expr)` |
| `isnull(expr)` | Is null | ✅ `expr IS NULL` |
| `isnotnull(expr)` | Is not null | ✅ `expr IS NOT NULL` |
| `isempty(s)` | Is empty string | ✅ `s = ''` or `length(s) = 0` |
| `isnotempty(s)` | Is not empty | ✅ `s <> ''` or `length(s) > 0` |

### 8.10 Window Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `row_number()` | Row number | ✅ `row_number() OVER (...)` |
| `row_cumsum(col, [restart])` | Cumulative sum | ✅ `sum(col) OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING)` |
| `row_rank_dense()` | Dense rank | ✅ `dense_rank() OVER (...)` |
| `row_rank_min()` | Minimum rank | ✅ `rank() OVER (...)` |
| `prev(col, [offset], [default])` | Previous row value | ✅ `lag(col, offset, default) OVER (...)` |
| `next(col, [offset], [default])` | Next row value | ✅ `lead(col, offset, default) OVER (...)` |

### 8.11 Hash Functions ✅

| Function | Description | DuckDB |
|----------|-------------|--------|
| `hash(v, [mod])` | Hash value | ✅ `hash(v)` (mod manually: `hash(v) % mod`) |
| `hash_combine(h1, h2)` | Combine hashes | ⚠️ Manual XOR combination |
| `hash_many(v1, v2, ...)` | Hash multiple values | ⚠️ `hash(concat(v1,v2,...))` |
| `hash_md5(v)` | MD5 hash | ✅ `md5(v)` |
| `hash_sha1(v)` | SHA1 hash | ❌ Not built-in |
| `hash_sha256(v)` | SHA256 hash | ✅ `sha256(v)` |
| `hash_xxhash64(v)` | XXHash64 | ⚠️ Use `hash(v)` (different algorithm) |

### 8.12 Geospatial Functions ⚠️

**DuckDB Compatibility Summary:**
- ⚠️ Requires `spatial` extension
- ✅ Distance: `ST_Distance`, `ST_DistanceSphere`
- ✅ Point in polygon: `ST_Contains`, `ST_Within`
- ⚠️ Geohash: `ST_GeoHash` (different API)
- ❌ S2/H3 cells: Not natively supported
- ✅ Area/centroid: `ST_Area`, `ST_Centroid`

| Function | Description | DuckDB (spatial extension) |
|----------|-------------|--------|
| `geo_distance_2points(...)` | Distance between points | ✅ `ST_Distance` or `ST_DistanceSphere` |
| `geo_point_in_circle(...)` | Point in circle | ✅ `ST_DWithin` |
| `geo_point_in_polygon(...)` | Point in polygon | ✅ `ST_Contains` |
| `geo_point_to_geohash(...)` | Point to geohash | ⚠️ `ST_GeoHash` |
| `geo_point_to_s2cell(...)` | Point to S2 cell | ❌ Not supported |
| `geo_point_to_h3cell(...)` | Point to H3 cell | ❌ Not supported (use h3 extension) |
| `geo_polygon_area(...)` | Polygon area | ✅ `ST_Area` |
| `geo_polygon_centroid(...)` | Polygon centroid | ✅ `ST_Centroid` |
| `geo_line_length(...)` | Line length | ✅ `ST_Length` |
| `geo_geohash_to_polygon(...)` | Geohash to polygon | ⚠️ `ST_GeomFromGeoHash` |
| (many more geo functions...) | | |

### 8.13 IPv4/IPv6 Functions ⚠️

**DuckDB Compatibility Summary:**
- ⚠️ Requires `inet` extension for some functions
- ⚠️ Most require manual implementation via string/numeric operations

| Function | Description | DuckDB |
|----------|-------------|--------|
| `ipv4_compare(ip1, ip2)` | Compare IPv4 | ⚠️ Cast to INET and compare |
| `ipv4_is_in_range(ip, range)` | IP in range | ⚠️ `host(ip) << range` with inet extension |
| `ipv4_is_in_any_range(ip, ranges)` | IP in any range | ⚠️ Multiple range checks |
| `ipv4_is_match(ip1, ip2, prefix)` | IPs match | ⚠️ Prefix comparison |
| `ipv4_is_private(ip)` | Is private IP | ⚠️ Check against RFC1918 ranges |
| `ipv4_netmask_suffix(ip)` | Get netmask | ⚠️ Manual parsing |
| `ipv4_range_to_cidr_list(start, end)` | Range to CIDR | ❌ Complex algorithm |
| `ipv6_compare(ip1, ip2)` | Compare IPv6 | ⚠️ Similar to IPv4 |
| `ipv6_is_match(ip1, ip2, prefix)` | IPv6 match | ⚠️ Similar to IPv4 |
| `ipv6_is_in_range(ip, range)` | IPv6 in range | ⚠️ Similar to IPv4 |
| `format_ipv4(ip, [prefix])` | Format IPv4 | ⚠️ String formatting |
| `format_ipv4_mask(ip, prefix)` | Format with mask | ⚠️ String formatting |
| `geo_info_from_ip_address(ip)` | IP geolocation | ❌ Requires external data/service |

### 8.14 Series Functions ❌

**DuckDB Compatibility:** ❌ KQL series functions are designed for time series arrays created by `make-series`. DuckDB does not have native time series array operations. Would require:
- ⚠️ Element-wise operations: `list_transform` with lambda functions
- ❌ Statistical analysis (fit, decompose, forecast): No equivalent
- ❌ Signal processing (FFT, FIR, IIR): No equivalent
- ⚠️ Basic operations (sum, fill): Manual array manipulation

| Function | Description |
|----------|-------------|
| `series_add(s1, s2)` | Element-wise add |
| `series_subtract(s1, s2)` | Element-wise subtract |
| `series_multiply(s1, s2)` | Element-wise multiply |
| `series_divide(s1, s2)` | Element-wise divide |
| `series_abs(s)` | Element-wise abs |
| `series_cos(s)` | Element-wise cos |
| `series_sin(s)` | Element-wise sin |
| `series_exp(s)` | Element-wise exp |
| `series_log(s)` | Element-wise log |
| `series_stats(s)` | Statistics |
| `series_fit_line(s)` | Linear regression |
| `series_fit_2lines(s)` | Two-segment regression |
| `series_fit_poly(s, degree)` | Polynomial fit |
| `series_outliers(s)` | Anomaly scores |
| `series_decompose(s)` | Decomposition |
| `series_decompose_anomalies(s)` | Anomaly detection |
| `series_decompose_forecast(s)` | Forecasting |
| `series_fft(s)` | Fast Fourier Transform |
| `series_ifft(s)` | Inverse FFT |
| `series_fir(s, filter)` | FIR filter |
| `series_iir(s, num, denom)` | IIR filter |
| `series_fill_forward(s)` | Fill forward |
| `series_fill_backward(s)` | Fill backward |
| `series_fill_linear(s)` | Linear interpolation |
| `series_fill_const(s, value)` | Fill with constant |
| `series_seasonal(s)` | Seasonal component |
| `series_periods_detect(s)` | Detect periods |
| `series_periods_validate(s, periods)` | Validate periods |
| `series_pearson_correlation(s1, s2)` | Pearson correlation |
| `series_cosine_similarity(s1, s2)` | Cosine similarity |
| `series_dot_product(s1, s2)` | Dot product |
| `series_magnitude(s)` | Magnitude |
| `series_sum(s)` | Sum elements |
| `series_product(s)` | Product elements |

### 8.15 Unit Conversion Functions ⚠️

**DuckDB:** ⚠️ No built-in unit conversion functions. Implement as multiplication by conversion factors.

| Function | Description | DuckDB |
|----------|-------------|--------|
| `convert_angle(v, from, to)` | Angle conversion | ⚠️ Manual: `v * factor` |
| `convert_energy(v, from, to)` | Energy conversion | ⚠️ Manual: `v * factor` |
| `convert_force(v, from, to)` | Force conversion | ⚠️ Manual: `v * factor` |
| `convert_length(v, from, to)` | Length conversion | ⚠️ Manual: `v * factor` |
| `convert_mass(v, from, to)` | Mass conversion | ⚠️ Manual: `v * factor` |
| `convert_speed(v, from, to)` | Speed conversion | ⚠️ Manual: `v * factor` |
| `convert_temperature(v, from, to)` | Temperature conversion | ⚠️ Manual: formula varies |
| `convert_volume(v, from, to)` | Volume conversion | ⚠️ Manual: `v * factor` |

### 8.16 Metadata Functions ❌

**DuckDB:** ❌ Most are Kusto-specific cluster/ingestion metadata. Some have partial equivalents.

| Function | Description | DuckDB |
|----------|-------------|--------|
| `column_ifexists(name, default)` | Column if exists | ⚠️ Use `COALESCE` with schema check |
| `current_cluster_endpoint()` | Current cluster | ❌ N/A |
| `current_database()` | Current database | ✅ `current_database()` |
| `current_principal()` | Current principal | ❌ N/A |
| `current_principal_details()` | Principal details | ❌ N/A |
| `current_principal_is_member_of(...)` | Check membership | ❌ N/A |
| `cursor_after(cursor)` | Cursor filter | ❌ N/A |
| `estimate_data_size()` | Estimate size | ❌ N/A |
| `extent_id()` | Extent ID | ❌ N/A |
| `extent_tags()` | Extent tags | ❌ N/A |
| `ingestion_time()` | Ingestion time | ❌ N/A (no ingestion metadata) |

---

## 9. Aggregation Functions

### 9.1 Statistical Aggregations ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `count()` | Count rows | ✅ `count(*)` |
| `countif(predicate)` | Conditional count | ✅ `count(*) FILTER (WHERE pred)` or `sum(CASE WHEN pred THEN 1 ELSE 0 END)` |
| `count_distinct(expr)` | Distinct count (exact) | ✅ `count(DISTINCT expr)` |
| `count_distinctif(expr, pred)` | Conditional distinct | ⚠️ `count(DISTINCT CASE WHEN pred THEN expr END)` |
| `dcount(expr, [accuracy])` | Approximate distinct | ✅ `approx_count_distinct(expr)` |
| `dcountif(expr, pred, [acc])` | Conditional approximate distinct | ⚠️ With FILTER clause |
| `sum(expr)` | Sum | ✅ `sum(expr)` |
| `sumif(expr, predicate)` | Conditional sum | ✅ `sum(expr) FILTER (WHERE pred)` |
| `avg(expr)` | Average | ✅ `avg(expr)` |
| `avgif(expr, predicate)` | Conditional average | ✅ `avg(expr) FILTER (WHERE pred)` |
| `min(expr)` | Minimum | ✅ `min(expr)` |
| `minif(expr, predicate)` | Conditional minimum | ✅ `min(expr) FILTER (WHERE pred)` |
| `max(expr)` | Maximum | ✅ `max(expr)` |
| `maxif(expr, predicate)` | Conditional maximum | ✅ `max(expr) FILTER (WHERE pred)` |
| `stdev(expr)` | Sample standard deviation | ✅ `stddev_samp(expr)` |
| `stdevif(expr, predicate)` | Conditional stdev | ✅ With FILTER clause |
| `stdevp(expr)` | Population stdev | ✅ `stddev_pop(expr)` |
| `variance(expr)` | Sample variance | ✅ `var_samp(expr)` |
| `varianceif(expr, pred)` | Conditional variance | ✅ With FILTER clause |
| `variancep(expr)` | Population variance | ✅ `var_pop(expr)` |
| `variancepif(expr, pred)` | Conditional pop variance | ✅ With FILTER clause |
| `percentile(expr, n)` | Nth percentile | ✅ `percentile_cont(n) WITHIN GROUP (ORDER BY expr)` |
| `percentiles(expr, n1, n2...)` | Multiple percentiles | ⚠️ Multiple percentile_cont calls |
| `percentiles_array(expr, arr)` | Percentiles from array | ⚠️ Multiple calls |
| `percentilesw(expr, weight, n)` | Weighted percentile | ❌ No direct equivalent |
| `percentilesw_array(expr, w, arr)` | Weighted from array | ❌ No direct equivalent |

### 9.2 Row Selector Aggregations ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `arg_max(expr, *)` | Row with max value | ⚠️ `DISTINCT ON` or window function with `row_number()` |
| `arg_min(expr, *)` | Row with min value | ⚠️ `DISTINCT ON` or window function |
| `take_any(expr)` | Any non-empty value | ✅ `any_value(expr)` or `first(expr)` |
| `take_anyif(expr, pred)` | Conditional any | ⚠️ `any_value(expr) FILTER (WHERE pred)` |

### 9.3 Dynamic Aggregations ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `make_list(expr, [limit])` | Collect to list | ✅ `list(expr)` or `array_agg(expr)` |
| `make_list_if(expr, pred, [limit])` | Conditional list | ✅ `list(expr) FILTER (WHERE pred)` |
| `make_list_with_nulls(expr)` | List including nulls | ✅ `list(expr)` (includes nulls by default) |
| `make_set(expr, [limit])` | Collect to set | ⚠️ `list(DISTINCT expr)` |
| `make_set_if(expr, pred, [limit])` | Conditional set | ⚠️ `list(DISTINCT expr) FILTER (WHERE pred)` |
| `make_bag(expr)` | Merge to bag | ⚠️ JSON object merging via `json_group_object` |
| `make_bag_if(expr, pred)` | Conditional bag | ⚠️ With FILTER clause |
| `buildschema(expr)` | Build dynamic schema | ❌ No equivalent |

### 9.4 Binary Aggregations ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `binary_all_and(expr)` | Bitwise AND all | ✅ `bit_and(expr)` |
| `binary_all_or(expr)` | Bitwise OR all | ✅ `bit_or(expr)` |
| `binary_all_xor(expr)` | Bitwise XOR all | ✅ `bit_xor(expr)` |

### 9.5 Sketch Aggregations ⚠️

| Function | Description | DuckDB |
|----------|-------------|--------|
| `hll(expr, [accuracy])` | HyperLogLog sketch | ⚠️ `approx_count_distinct` (no sketch export) |
| `hll_if(expr, pred, [acc])` | Conditional HLL | ⚠️ With FILTER clause |
| `hll_merge(hll)` | Merge HLL sketches | ❌ No sketch merging |
| `tdigest(expr)` | T-Digest sketch | ❌ No sketch export |
| `tdigest_merge(td)` | Merge T-Digests | ❌ No sketch merging |

### 9.6 Scalar Sketch Functions

| Function | Description |
|----------|-------------|
| `dcount_hll(hll)` | Count from HLL |
| `percentile_tdigest(td, n)` | Percentile from T-Digest |
| `percentile_array_tdigest(td, arr)` | Percentiles array |
| `percentrank_tdigest(td, val)` | Percent rank |
| `rank_tdigest(td, val)` | Rank |
| `merge_tdigest(td1, td2)` | Merge (scalar) |

---

## 10. Window Functions ✅

Window functions operate on serialized row sets (after `serialize` or `sort`).

**DuckDB:** ✅ Full support via OVER clause. KQL's implicit serialization becomes explicit window specification.

| Function | Description | DuckDB |
|----------|-------------|--------|
| `row_number()` | Sequential row number | ✅ `row_number() OVER (ORDER BY ...)` |
| `row_cumsum(col, [restart])` | Cumulative sum | ✅ `sum(col) OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING)` |
| `row_rank_dense()` | Dense rank | ✅ `dense_rank() OVER (ORDER BY ...)` |
| `row_rank_min()` | Minimum rank | ✅ `rank() OVER (ORDER BY ...)` |
| `prev(col, [offset], [default])` | Previous row value | ✅ `lag(col, offset, default) OVER (ORDER BY ...)` |
| `next(col, [offset], [default])` | Next row value | ✅ `lead(col, offset, default) OVER (ORDER BY ...)` |

**Conversion Note:** KQL's `serialize` operator establishes row order; in DuckDB, the ORDER BY in the OVER clause serves this purpose.

**Test Cases:**
```kql
// Row numbering
T | sort by x | serialize rn = row_number()

// Previous/Next
T | sort by Timestamp | serialize 
  | extend PrevValue = prev(Value), NextValue = next(Value)

// Cumulative sum
T | sort by Date | serialize 
  | extend RunningTotal = row_cumsum(Amount)

// Ranking
T | sort by Score desc | serialize 
  | extend Rank = row_rank_min(), DenseRank = row_rank_dense()
```

---

## 11. Plugins ❌

Plugins are invoked via the `evaluate` operator.

**DuckDB:** ❌ Most plugins are Kusto-specific with no equivalent. Some can be approximated with manual transformations.

### 11.1 Plugin Syntax

```ebnf
evaluate_op = 'evaluate' [ hints ] plugin_name '(' [ args ] ')'
```

### 11.2 Built-in Plugins

| Plugin | Description | DuckDB |
|--------|-------------|--------|
| `autocluster` | Find common patterns | ❌ N/A (ML plugin) |
| `bag_unpack` | Expand bag to columns | ⚠️ JSON extract with known keys |
| `basket` | Association rule mining | ❌ N/A (ML plugin) |
| `cosmosdb_sql_request` | Query Cosmos DB | ❌ N/A |
| `dcount_intersect` | Intersect distinct counts | ⚠️ Set operations on distinct values |
| `diffpatterns` | Compare patterns | ❌ N/A (ML plugin) |
| `infer_storage_schema` | Infer schema | ⚠️ `DESCRIBE` or `PRAGMA table_info` |
| `ipv4_lookup` | IPv4 enrichment | ⚠️ JOIN with lookup table |
| `ipv6_lookup` | IPv6 enrichment | ⚠️ JOIN with lookup table |
| `mysql_request` | Query MySQL | ⚠️ `mysql_scan` extension |
| `narrow` | Wide to narrow format | ⚠️ UNPIVOT or manual UNION |
| `pivot` | Pivot table | ✅ `PIVOT` statement |
| `postgresql_request` | Query PostgreSQL | ✅ `postgres_scan` extension |
| `preview` | Preview rows | ✅ `LIMIT` |
| `python` | Python script | ❌ N/A |
| `R` | R script | ❌ N/A |
| `rolling_percentile` | Rolling percentile | ⚠️ Window function with percentile |
| `rows_near` | Find nearby rows | ⚠️ Self-join with range condition |
| `schema_merge` | Merge schemas | ❌ N/A |
| `sequence_detect` | Sequence detection | ❌ N/A (pattern matching) |
| `sliding_window_counts` | Sliding window stats | ⚠️ Window functions |
| `sql_request` | Query SQL Server | ❌ N/A (no SQL Server extension) |

### 11.3 Plugin Test Cases

```kql
// bag_unpack
T | evaluate bag_unpack(Properties)

// pivot
T | evaluate pivot(Category, sum(Amount))

// narrow
T | evaluate narrow()

// autocluster
T | evaluate autocluster()

// basket
T | evaluate basket(0.05)

// diffpatterns
T1 | evaluate diffpatterns(T2, "EventType")

// python
T | evaluate python(
    typeof(*, result:string),
    ```
    result = df['col'].apply(lambda x: x.upper())
    ```
)

// sql_request
evaluate sql_request(
    'Server=tcp:server.database.windows.net;Database=db;',
    'SELECT * FROM Table'
)
```

---

## 12. Special Constructs

### 12.1 Regular Expressions ⚠️

KQL uses RE2 syntax for regular expressions.

**DuckDB:** ⚠️ Uses POSIX-extended regex (mostly compatible with RE2). Some edge cases may differ.

**Regex Operators:**
- `matches regex` → ✅ `regexp_matches(text, pattern)`
- `extract(regex, group, text)` → ✅ `regexp_extract(text, pattern, group)`
- `extract_all(regex, text)` → ✅ `regexp_extract_all(text, pattern)`
- `replace_regex(text, regex, rewrite)` → ✅ `regexp_replace(text, pattern, replacement)`

**RE2 Syntax:**
| Pattern | Meaning |
|---------|---------|
| `.` | Any character |
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one |
| `^` | Start of string |
| `$` | End of string |
| `[abc]` | Character class |
| `[^abc]` | Negated class |
| `\d` | Digit |
| `\w` | Word character |
| `\s` | Whitespace |
| `(...)` | Capture group |
| `(?:...)` | Non-capture group |
| `a|b` | Alternation |
| `{n}` | Exactly n |
| `{n,m}` | Between n and m |

**Test Cases:**
```kql
print r1 = "abc123" matches regex "\\d+"           // true
print r2 = extract("(\\d+)", 1, "abc123")          // "123"
print r3 = extract_all("(\\d+)", "a1b2c3")         // ["1","2","3"]
print r4 = replace_regex("a1b2", "\\d", "X")       // "aXbX"
```

### 12.2 Cross-Cluster Queries ❌

**DuckDB:** ❌ N/A. No Kusto cluster concept. For multi-database scenarios, use ATTACH or catalog extensions.

```kql
// Query another cluster
cluster("https://other.kusto.windows.net").database("db").Table

// Query another database
database("OtherDb").Table

// Functions
cluster("other").database("db").MyFunction("param")
```

### 12.3 External Tables ⚠️

**DuckDB:** ⚠️ Use `read_csv`, `read_json`, `read_parquet` with `httpfs` extension for remote files.

```kql
// External data inline
externaldata(Col1:type1, Col2:type2)
[
    @"https://storage/container/file1.csv",
    @"https://storage/container/file2.csv"
]
with (format="csv", ignoreFirstRecord=true)
```

**DuckDB equivalent:**
```sql
SELECT * FROM read_csv(['https://storage/container/file1.csv', 'https://storage/container/file2.csv'], 
                       header=true, columns={'Col1': 'type1', 'Col2': 'type2'});
```

### 12.4 Materialized Views ❌

**DuckDB:** ❌ Different concept. DuckDB has no incremental materialized views like Kusto. Use regular views or CTEs with MATERIALIZED hint.

```kql
// Reference materialized view
materialized_view("ViewName")

// With hints
materialized_view("ViewName", max_age=1h)
```

### 12.5 Query Hints ❌

**DuckDB:** ❌ Hints are ignored. DuckDB uses its own query optimizer. No equivalent hint system.

```ebnf
hint = 'hint' '.' hint_name '=' value
```

**Common Hints:**
| Hint | Operators | Purpose | DuckDB |
|------|-----------|---------|--------|
| `hint.shufflekey` | summarize, join | Shuffle key | ❌ Ignored |
| `hint.strategy` | join, partition | Strategy selection | ❌ Ignored |
| `hint.materialized` | as | Force materialization | ⚠️ CTE MATERIALIZED |
| `hint.remote` | Various | Remote execution | ❌ Ignored |
| `hint.spread` | Various | Parallelization | ❌ Ignored |
| `hint.concurrency` | Various | Concurrency level | ❌ Ignored |

### 12.6 Access Modifiers ❌

**DuckDB:** ❌ No hot cache concept. Ingestion time filtering not applicable.

```kql
// Table function with scope
table("TableName", "hotcache")  // Query hot cache only
table("TableName", "all")       // Query all data

// Query with timespan
table("TableName") | where ingestion_time() > ago(1h)
```

---

## 13. Schema Entities ⚠️

**DuckDB:** ⚠️ Schema concepts map differently. No cluster hierarchy; uses catalogs, schemas, and tables.

### 13.1 Databases ⚠️

**DuckDB:** Use `USE database_name` or `ATTACH 'file.db' AS db_name`. No cluster() function.

```kql
database("DatabaseName")
cluster("cluster").database("db")
```

**DuckDB equivalent:**
```sql
-- Reference another database
SELECT * FROM other_db.schema_name.table_name;
-- Or attach
ATTACH 'path/to/db.duckdb' AS other_db;
```

### 13.2 Tables ✅

**DuckDB:** ✅ Direct table references work. `table()` function becomes simple table name.

```kql
TableName
database("db").TableName
table("TableName")
```

**DuckDB equivalent:**
```sql
SELECT * FROM TableName;
SELECT * FROM other_db.TableName;
```

### 13.3 Columns ✅

**DuckDB:** ✅ Column references work the same. Star expansion supported.

- Referenced by name in expressions
- Schema: `(ColumnName:Type, ...)` → DuckDB: `CREATE TABLE t (ColumnName Type, ...)`
- Star expansion: `*`, `Table.*` → ✅ Works the same

### 13.4 Functions ⚠️

**DuckDB:** ⚠️ No stored functions in Kusto sense. Use macros or UDFs.

```kql
// Stored function
FunctionName(arg1, arg2)

// Database function
database("db").FunctionName()

// Cluster function
cluster("c").database("db").FunctionName()
```

**DuckDB equivalent:**
```sql
-- Define macro
CREATE MACRO FunctionName(arg1, arg2) AS (arg1 + arg2);
-- Use it
SELECT FunctionName(1, 2);
```

---

## 14. Query Parameters

### 14.1 Declaration

```kql
declare query_parameters(
    startDate:datetime,
    endDate:datetime = datetime(2024-12-31),
    minValue:long = 0
);
```

### 14.2 Usage

```kql
declare query_parameters(threshold:int = 100);
T | where Value > threshold
```

### 14.3 Client API

Parameters are passed via client API request properties.

---

## 15. Parser Test Case Reference

Representative test patterns for parser validation:

```kql
// Lexical
let valid_name = 1; let ['reserved-word'] = 3;
print "\n\r\t\\", @"no\escape", h"hidden"
print 42, 0xFF, 3.14, 1e10

// Types
print bool(true), int(null), datetime(2024-01-15), dynamic([1,2,3])

// Operators
print 10 + 5, 10 % 3, "abc" =~ "ABC", 5 between (1 .. 10)
print "hello" has "hello", "a" in ("a", "b")

// Statements
let x = 42; let f = (n:int) { n * 2 };
declare query_parameters(p1:int, p2:string = "default");

// Tabular operators
T | where x > 10 | project a, b | extend c = a + b
T | summarize count() by bin(ts, 1h) | top 10 by count_ desc
T1 | join kind=leftouter T2 on $left.a == $right.b
T | mv-expand arr | parse msg with "Error:" err ", Code:" code:int

// Functions
print now(), ago(1h), strlen("hello"), hash_sha256("test")
T | summarize count(), dcount(user), percentile(val, 95)
```

---

## Appendix A: Grammar Summary (EBNF)

```ebnf
query = { statement ';' } tabular_expression

statement = let_statement 
          | set_statement 
          | query_parameters_statement

let_statement = 'let' identifier '=' expression
              | 'let' identifier '=' '(' params ')' '{' expression '}'

set_statement = 'set' option_name [ '=' value ]

query_parameters_statement = 'declare' 'query_parameters' '(' param_list ')'

tabular_expression = data_source { '|' tabular_operator }

data_source = table_name
            | '(' tabular_expression ')'
            | identifier
            | function_call

tabular_operator = where_op | project_op | extend_op | summarize_op
                 | join_op | union_op | sort_op | top_op | take_op
                 | distinct_op | mv_expand_op | parse_op | make_series_op
                 | render_op | evaluate_op | ...

expression = primary_expression
           | unary_expression
           | binary_expression
           | conditional_expression
           | function_call

primary_expression = literal | identifier | '(' expression ')'

literal = bool_literal | int_literal | long_literal | real_literal
        | string_literal | datetime_literal | timespan_literal
        | guid_literal | dynamic_literal

function_call = identifier '(' [ arg_list ] ')'
arg_list = expression { ',' expression }
```

---

## Appendix B: Reserved Words

```
and, as, between, by, consume, contains, count, database, declare,
default, distinct, evaluate, extend, externaldata, false, find,
fork, from, getschema, has, in, invoke, join, kind, let, like,
limit, lookup, make-series, matches, materialize, mv-apply, mv-expand,
not, of, on, or, order, partition, pattern, print, project,
project-away, project-keep, project-rename, project-reorder, range,
reduce, regex, render, sample, sample-distinct, scan, search,
serialize, set, sort, step, summarize, take, to, top, top-nested,
true, typeof, union, where, with
```

---

## Document Information

- **Purpose:** KQL-to-DuckDB SQL parser implementation reference
- **Scope:** Data exploration queries only (read-only operations)
- **Excludes:** Management commands, ingestion, DDL, schema modification
