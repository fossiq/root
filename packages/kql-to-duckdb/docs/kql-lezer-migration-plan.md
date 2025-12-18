# KQL-Lezer Migration Plan (kql-to-duckdb)

Goal: Replace `@fossiq/kql-parser` (tree-sitter AST) usage in `@fossiq/kql-to-duckdb` with `@fossiq/kql-lezer` (Lezer CST), so translation runs from the Lezer syntax tree.

Constraints:
- `@fossiq/kql-lezer` does **not** produce a typed AST (and `ast` is intentionally out of scope).
- Migration must translate directly from Lezer CST (`SyntaxNode`) → SQL.
- Keep existing `kql-to-duckdb` behavior/tests as the correctness oracle.

---

## Phase 0: Audit (Do First)

- [ ] Locate all imports of `@fossiq/kql-parser` in `packages/kql-to-duckdb/src`.
- [ ] List the operator/expression types currently used (e.g. `Where`, `Project`, `BetweenExpression`, etc.).
- [ ] Identify current public translator entrypoint(s) and how parse errors are handled.

---

## Phase 1: Make Lezer Parser Consumable (Library API)

`kql-to-duckdb` needs a way to obtain a Lezer parse tree.

Recommended API shape in `@fossiq/kql-lezer`:
- [ ] Export `parser` from `packages/kql-lezer/src/index.ts` **or** add `parseTree(doc): Tree`.
  - Parse errors remain available via `parseErrors(doc)`.
  - Avoid CodeMirror-only entrypoints for backend packages.

Acceptance:
- `kql-to-duckdb` can `import { parser, parseErrors } from "@fossiq/kql-lezer"`.

---

## Phase 2: CST Utilities in kql-to-duckdb

Add a small CST helper module (new file), e.g.:
- [ ] `packages/kql-to-duckdb/src/lezer-cst.ts`

Suggested helpers:
- [ ] `text(node, doc)` -> slice text
- [ ] `children(node)` iterator
- [ ] `findChild(node, name)` / `expectChild(node, name)`
- [ ] `childrenNamed(node, names)`
- [ ] `unwrapSingle(node)` to skip wrapper rules (common in the grammar)
- [ ] Helpers to skip punctuation tokens (`Pipe`, `Comma`, `OpenParen`, `CloseParen`, etc.)

Acceptance:
- Utilities are used by translation code (not duplicated ad-hoc in translator).

---

## Phase 3: Implement Translation From Lezer CST (Minimal Parity First)

Strategy: keep the existing CTE pipeline approach, but swap “typed AST switch” for “CST node dispatch”.

### 3.1 Top-Level / Pipeline

- [ ] Parse root: `parser.parse(doc)` and start from `tree.topNode` (`Query`).
- [ ] Locate `pipelineExpression` (via `statement`).
- [ ] Implement base table translation for `tableExpression` (identifier / parenthesized).
- [ ] Iterate over `(Pipe operator)*` pairs.

Acceptance:
- Queries like `Events | where x == 1` produce SQL with correct CTE pipeline shape.

### 3.2 Operator Clauses (One-at-a-Time)

Implement in roughly this order (matches current Lezer coverage and common usage):
- [ ] `whereClause`
- [ ] `projectClause` + `project-*` variants
- [ ] `extendClause`
- [ ] `summarizeClause`
- [ ] `sortClause`
- [ ] `limitClause` / `takeClause` / `topClause`
- [ ] `distinctClause`

Defer / optional depending on current translator scope:
- [ ] `joinClause`
- [ ] `unionClause`
- [ ] `searchClause`
- [ ] `findClause`
- [ ] `mvExpandClause`

Acceptance:
- For each operator implemented, add/convert tests and match existing SQL output.
- For unimplemented operators, throw a descriptive “Unsupported operator” error (no silent degradation).

---

## Phase 4: Expression Translation Mapping (CST → SQL)

Implement a CST-based expression translator:
- [ ] `translateExpression(node, doc): string` dispatches by `node.name`.

Key rules/tokens to support:
- [ ] `orExpression`, `andExpression`, `notExpression`
- [ ] `comparisonExpression` + `comparisonOperator`
- [ ] `between` / `NotBetween` pattern
- [ ] Arithmetic: `sumExpression`, `termExpression`, `unaryExpression`
- [ ] `functionCall` + `argumentList`
- [ ] `columnReference` + bracket indexing (`OpenBracket expression CloseBracket`)* if supported
- [ ] Literals/tokens: `Number`, `String`, `Timespan`, `DateTimeLiteral`, `GuidLiteral`

Acceptance:
- Parity with existing `kql-parser` behavior for supported subset.

---

## Phase 5: Test Strategy

Preferred migration pattern (keeps risk low):
- [ ] Add an internal toggle (temporary) in `kql-to-duckdb` to run either parser backend:
  - `parser: "tree-sitter" | "lezer"`
- [ ] Run the existing test suite against both backends during transition.
- [ ] Remove the tree-sitter path once parity is achieved.

Minimum viable:
- [ ] Switch to Lezer and update expected SQL outputs as needed (only when correctness changes).

Acceptance:
- Full existing `packages/kql-to-duckdb/tests` passes with Lezer backend.

---

## Phase 6: Cleanup

- [ ] Remove `@fossiq/kql-parser` dependency from `packages/kql-to-duckdb/package.json` when unused.
- [ ] Remove dead types / code paths / docs referencing tree-sitter parser.
- [ ] Document any known behavior differences and why they’re acceptable.

---

## Notes / Gotchas

- Lezer keyword specialization means you may see node names like `where`, `union`, `mvexpand` (not `kw_where`) in the CST.
- CST traversal is more error-prone than typed AST; invest in helper utilities early.
- Keep errors loud: don’t “parse” unknown structures into empty SQL.
