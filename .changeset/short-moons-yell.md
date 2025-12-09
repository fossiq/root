---
"@fossiq/kql-to-duckdb": minor
"@fossiq/kql-parser": patch
---

Add support for 4 new KQL operators and enhance translator capabilities:

**New Operators (Phases 11-14):**

- DateTime functions: `now()` and `ago()` with timespan support
- Let statements for variable definitions and reuse
- MV-expand operator for multi-value column expansion
- Search operator for full-text search across columns

**Features Added:**

- 113 passing integration tests (up from 85)
- 35+ mapped functions supporting string, math, type conversions, and datetime operations
- Case-insensitive search with LIKE patterns
- Variable substitution in let statements
- UNNEST support for array/multi-value expansion
- Timespan to SQL INTERVAL conversion

All operators integrate seamlessly into pipelines with proper CTE chaining.
