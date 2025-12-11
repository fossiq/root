# @fossiq/kql-lezer

Lezer grammar for KQL syntax highlighting and editor support.

## TODO (per implementation guide)

- Statements: add `set` commands and full let function/view definitions with semicolon/whitespace rules.
- Operators: cover `find`, `sample`, project variants (away/keep/rename/reorder), `mv-expand`/`mv-apply`, `make-series`, `parse` modes and patterns, `evaluate` plugins, `render`, `union withsource`, join `innerunique` plus hints, `search` kinds, `top-nested`, `materialize`/`toscalar`, `distinct` wildcards.
- Expressions: case-sensitive string ops (`contains_cs`, `has_cs`), `in~`, regex flags, `between`/`!between`, comparisons beyond identifier-vs-literal, subqueries.
- Tokens/literals: quoted identifiers, richer string forms (verbatim/backtick/obfuscated), combined timespans, datetime literals, identifier rules for `__`/`$`, more escapes.
- Functions/types: reflect built-in function categories, type aliases/conversions, aggregation function coverage.
- Special constructs: fuller `mv-expand` options (kind/itemindex/parallel), `parse` type hints, time-series fill behavior.

## Will not support

- Source-modifying commands (update/alter/drop/rename columns or tables, in-place writes); this grammar targets read/query-only scenarios.
