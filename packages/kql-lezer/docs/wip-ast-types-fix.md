# WIP: AST Types Fix

This document tracks the progress of fixing the missing AST types and related build issues.

## Summary

The initial goal was to add missing AST types to `@fossiq/kql-ast` that are used by `@fossiq/kql-lezer`. This led to a series of build failures in the `kql-lezer` package during grammar generation, revealing issues in the `@fossiq/lezer-grammar-generator` package.

## Completed Tasks

-   [x] Added missing AST types to `packages/kql-ast/src/index.ts`:
    -   `ErrorNode`
    -   `LetStatement`
    -   `TabularOperator`
    -   `WhereOperator`
    -   `TableReference`
    -   `PipelineExpression`
    -   `Query` (replaces `KQLDocument`)
    -   `NumberLiteral`, `StringLiteral`
-   [x] Updated `cst-to-ast` implementation in `kql-lezer` to use `start`/`end` properties instead of `from`/`to` to align with `ASTNode`.
-   [x] Added a "Known Issues" section to `packages/lezer-grammar-generator/docs/lezer-grammar-generator-spec.md` to document the regex conversion issue.
-   [x] Removed outdated `packages/kql-lezer/IMPLEMENTATION_LOG.md`.

## Problem Areas & Workarounds

The `@fossiq/lezer-grammar-generator` has several issues when converting `GrammarDefinition` to a Lezer grammar file:

1.  **Regex Conversion:** The `convertRegexToLezer` function in `serialize.ts` does not correctly handle all regex patterns.
    -   It failed on escaped dots (`\.`), causing `Number` and `Timespan` tokens to fail.
    -   It does not handle the `@` character in verbatim strings (`@""`), causing the `String` token to fail.
    -   **Workaround:** Patched `serialize.ts` to quote `@` characters that are not part of a keyword like `@digit`.

2.  **Macro Support:** The `generateLezerGrammar` function does not support `macros`.
    -   The `kw` helper needs a `kw<term>` macro to be defined.
    -   **Workaround:** Hacked `generate-kql-grammar.ts` to manually inject the macro definition into the generated grammar string.

3.  **Grammar Ambiguity:** The original expression rules were causing `shift/reduce` conflicts.
    -   **Fix:** Rewrote `AdditiveExpression` and `MultiplicativeExpression` to be left-recursive, which explicitly defines operator precedence.

## Next Steps

-   [ ] The `kql-lezer` build is still failing. The next step is to analyze and fix the current build error.
-   [ ] Once the build is successful, run the tests for `kql-lezer` to ensure all changes are working as expected.
-   [ ] Restore the full `String` token definition in `packages/kql-lezer/src/grammar/plugins/tokens/literals.ts` and ensure it works with the patched generator.
-   [ ] Remove the patch in `packages/lezer-grammar-generator/src/serialize.ts` and fix the `String` token with a `raw` string.
-   [ ] Clean up the hack in `packages/kql-lezer/scripts/generate-kql-grammar.ts` for macro injection, if a better solution is found.
