---
"@fossiq/kql-parser": patch
"@fossiq/kql-to-duckdb": patch
"@fossiq/kql-ast": patch
"@fossiq/kql-lezer": patch
---

Fix CI test script to handle packages without test files

- Updated test-packages.sh to check if test files exist before running bun test
- Prevents CI failures for packages like kql-ast that have test scripts but no test files
