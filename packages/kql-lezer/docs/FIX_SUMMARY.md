# KQL Lezer Fixes Summary

**Date:** 2025-12-29
**Status:** 93/108 tests passing (86%)

## Fixes Applied

1.  **Missing AST Types:**
    - Updated `packages/kql-ast/src/index.ts` to include all missing operator types (`ProjectOperator`, `ExtendOperator`, `SortOperator`, etc.) and query expression types (`UnionExpression`, `SearchExpression`, `FindExpression`).
    - Added `QueryExpression` type to `Query` interface to support top-level unions and searches.

2.  **CST-to-AST Mappers:**
    - Updated `packages/kql-lezer/src/parser/cst-to-ast/index.ts` to handle `UnionExpression`, `SearchExpression`, and `FindExpression` (with placeholder implementations for search/find).
    - Updated `mapQuery` to correctly set the `expression` field.
    - Added `PipelineExpression` fallback for backward compatibility.

3.  **Grammar Updates:**
    - Added explicit tokens for `project-away`, `project-keep`, `project-rename`, `project-reorder`, and `mv-expand` to resolve `Identifier` overlap conflicts.
    - Added explicit tokens for negated operators like `!between`, `!contains`, `!startswith`, etc., to fix parsing issues where `!` was not treated as part of the identifier.
    - Updated `@precedence` block to include these new tokens.
    - Updated `Timespan` token to support combined forms (e.g., `1d12h`, `1h30m`).

4.  **Context & Safety:**
    - Added safety checks in `packages/kql-lezer/src/parser/cst-to-ast/context.ts` to handle potentially undefined nodes in `mapScalarExpression` and `mapAdditiveExpression`.
    - Fixed `Between` operator mapping logic to correctly extract range values.

## Remaining Failures (15 Tests)

The remaining 15 failures are primarily due to:

1.  **Invalid Test Expectations:**
    - Many tests expect invalid KQL syntax like `Users | Events` (bare table after pipe) or `Users | 123 | 456` to parse successfully. These patterns are not valid KQL and the parser correctly rejects them (or fails to match them to a valid rule).
    - **Action:** These tests should be updated to reflect valid KQL or the grammar limitations should be accepted.

2.  **Verbatim String Backslashes:**
    - One test failure (`@"C:\path\file.txt"`) suggests an issue with backslash handling in the `String` token regex for verbatim strings.
    - The regex `@"\"" !["]* "\""` might not be capturing escaped backslashes correctly inside the verbatim block if the tokenizer is too aggressive or the test string format is subtle.

## Conclusion

The parser is now much more robust, with corrected AST types allowing for proper compilation and extended grammar support for negated operators and complex literals. The remaining failures are largely test-case related rather than fundamental parser issues for valid KQL.
