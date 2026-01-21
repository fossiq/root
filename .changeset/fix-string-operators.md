---
"@fossiq/kql-lezer": patch
"@fossiq/kql-to-duckdb": patch
"@fossiq/ui": patch
---

Fix string operators parsing and UI improvements

- Fixed kql-lezer to correctly parse string operators (contains, startswith, endswith, has) by handling GeneralComparisonOp wrapper nodes
- Fixed kql-to-duckdb translator to generate correct SQL LIKE patterns with wildcards for string operators
- Fixed ResultsTable to properly display bigint values as regular numbers
- Improved CodeMirror autocomplete to show aggregation functions in more contexts (after = and ( operators)
