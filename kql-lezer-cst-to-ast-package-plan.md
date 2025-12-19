# Plan: New Package for Lezer CST → Shared AST

Goal: Introduce a new package that converts the `@fossiq/kql-lezer` Lezer CST (parse tree) into the shared `@fossiq/kql-ast` AST in a **generic** way, so downstream consumers (SQL translator, semantic tools, etc.) can depend on a typed AST without using tree-sitter.

This is a **spec/plan** document intended for another agent to implement.

---

## Summary

- Add a new package: `packages/kql-lezer-to-ast/`
- Inputs: KQL source string (and/or Lezer `Tree`)
- Outputs: `ParseResult` (from `@fossiq/kql-ast`) with `ast` populated and `errors` populated using Lezer parse errors plus conversion errors.
- Keep the mapper generic: no SQL logic, no UI logic, no `kql-to-duckdb` dependencies.

---

## Context / Why

Lezer provides a CST (syntax tree closely reflecting grammar structure). Translating directly from CST tends to be brittle because:
- wrapper nodes and punctuation are in-band
- list separators are explicit nodes
- keywords can appear as specialized identifiers
- error recovery yields partial trees

A dedicated CST→AST mapper:
- normalizes structure once (single source of truth)
- exposes stable node shapes for downstream tools (typed AST)

---

## Package Placement & Naming

Proposed:
- Package directory: `packages/kql-lezer-to-ast/`
- Package name: `@fossiq/kql-lezer-to-ast`

Dependencies:
- `@fossiq/kql-lezer` (for parsing and node names)
- `@fossiq/kql-ast` (target AST + ParseResult/ParseError types)
- `@lezer/common` (Tree/SyntaxNode types)

Non-dependencies:
- `@fossiq/kql-to-duckdb` (no SQL)
- `@codemirror/*` (not needed)

---

## Public API (Proposed)

### Minimal API

```ts
import type { ParseResult } from "@fossiq/kql-ast";

export function parseToAST(doc: string): ParseResult;
```

Behavior:
- Uses Lezer parser to parse `doc`
- Collects parse errors (Lezer `⚠` nodes) → `ParseError[]`
- If parse errors exist: still attempts conversion but may return `ast: undefined` depending on severity policy (see below)

### Advanced API (optional)

```ts
import type { ParseResult, ParseError } from "@fossiq/kql-ast";
import type { Tree, SyntaxNode } from "@lezer/common";

export type ConvertOptions = {
  mode?: "best-effort" | "strict"; // default: best-effort
};

export function toAST(tree: Tree, doc: string, opts?: ConvertOptions): {
  ast?: ParseResult["ast"];
  errors: ParseError[];
};
```

Strict vs best-effort:
- `strict`: any conversion ambiguity/missing expected child produces a conversion error and aborts building `ast`
- `best-effort`: build partial AST where possible; include conversion errors in `errors`

---

## Internal Architecture

### Files (Suggested)

```
packages/kql-lezer-to-ast/
  src/
    index.ts                # exports parseToAST/toAST
    cursor.ts               # CST traversal utilities
    convert.ts              # top-level conversion orchestration
    convert-statement.ts    # statement/pipeline mapping
    convert-operators.ts    # where/project/extend/... operators
    convert-expr.ts         # expression mapping
    convert-literals.ts     # Number/String/Timespan/DateTime/Guid mapping
    errors.ts               # conversion error helpers
  tests/
    fixtures/               # input KQL + expected AST JSON
    to-ast.test.ts          # golden tests
```

### CST Traversal Utilities

Implement utility functions that make conversion safer and consistent:
- `text(node, doc): string`
- `children(node): SyntaxNode[]` (skip nulls)
- `childrenNamed(node, names): SyntaxNode[]`
- `findChild(node, name): SyntaxNode | undefined`
- `expectChild(node, name, ctx): SyntaxNode` (push conversion error if missing)
- `stripTokens(node, names)` for punctuation tokens like `Comma`, `OpenParen`, `CloseParen`
- `unwrap(node, ...wrapperNames)` (walk down single-child wrappers)
- list helpers:
  - `commaSeparated(node, itemNodeNames)` or parse patterns like `item (Comma item)*`
- `assertNode(node, expectedName, ctx)`

### Error Model

Conversion errors should be `ParseError` shaped:
- `type: "ParseError"`
- `message: "..."` (prefix with `CST→AST:`)
- `start`/`end`: use node bounds when available

Include both:
- parser errors from `@fossiq/kql-lezer` (Lezer `⚠`)
- conversion errors (unexpected node, missing child, unsupported rule form)

---

## Mapping Spec (Initial Scope)

Start with the subset already supported by `@fossiq/kql-lezer` grammar/tests and currently used in UI + kql-to-duckdb:

### Top-Level

Lezer nodes:
- `Query` → `KQLDocument` (or whatever the top type is in `@fossiq/kql-ast`)
- `statement`
- `letStatement`
- `pipelineExpression`

Rules:
- A document can contain a sequence of statements (the current grammar supports `letStatement statement?`)
- Represent pipeline as a base source + list of pipe operators

### Operators (tabular)

Map these Lezer clause nodes to AST operator nodes:
- `whereClause`
- `projectClause`
- `projectAwayClause` / `projectKeepClause` / `projectRenameClause` / `projectReorderClause`
- `extendClause`
- `sortClause`
- `limitClause` / `takeClause`
- `topClause`
- `distinctClause`
- `summarizeClause`
- `joinClause`
- `unionClause`
- `searchClause`
- `findClause`
- `mvExpandClause` (basic column list)

Important: this package should follow the `@fossiq/kql-ast` operator interfaces (agent should inspect `packages/kql-ast/src` types).

### Expressions

Lezer wrapper rules (expected shapes):
- `expression` → `orExpression`
- `orExpression`: `andExpression (or andExpression)*`
- `andExpression`: `notExpression (and notExpression)*`
- `notExpression`: `not notExpression | comparisonExpression`
- `comparisonExpression`:
  - binary compare: `sumExpression (comparisonOperator sumExpression)*`
  - between: `(between|NotBetween) ( min .. max )` form (already in grammar)
- arithmetic:
  - `sumExpression`: `termExpression ((Plus|Minus) termExpression)*`
  - `termExpression`: `unaryExpression ((Star|Slash|Percent) unaryExpression)*`
  - `unaryExpression`: `Minus unaryExpression | primaryExpression`
- `primaryExpression`: `functionCall | (expression) | literal | columnReference`
- `columnReference`: `identifier ( [ expression ] )*`
- `functionCall`: `functionName ( argumentList? )`
- `argumentList`: `expression (Comma expression)*`

Expression AST nodes should be the `@fossiq/kql-ast` equivalents (BinaryExpression, UnaryExpression, FunctionCall, IdentifierRef, Literal nodes, BetweenExpression, etc.).

### Literals

Lezer token nodes:
- `Number`
- `String` (includes verbatim/obfuscated variants in tokenization)
- `Timespan`
- `DateTimeLiteral`
- `GuidLiteral`

Represent in AST using `@fossiq/kql-ast` literal node types. Preserve the raw literal string where appropriate.

---

## Keyword / Specialization Handling

Lezer grammar uses `@specialize` macros, so keywords often appear as term names in the CST (e.g. `where`, `search`, `mvexpand`) rather than `Identifier`.

Mapping rules should:
- treat specialized keywords as syntactic markers and not as identifier references
- still parse identifiers from `Identifier` nodes when used as names

---

## Testing Strategy

### Golden Tests (Primary)

Add fixtures:
- `tests/fixtures/<name>.kql`
- `tests/fixtures/<name>.ast.json` (expected AST)

Test:
- `parseToAST(doc)` returns `errors.length === 0` and deep-equals `ast` to JSON fixture (or matches shape)

Start with small fixtures:
- `simple_table.kql`: `Events`
- `where_simple.kql`: `Events | where Value == 1`
- `project_cols.kql`: `Events | project A, B`
- `between.kql`: `Events | where Value between (1 .. 10)`
- `function_call.kql`: `Events | where Timestamp between (ago(7d) .. now())`

---

## Rollout Plan

1) Create package skeleton with build/test scripts.
2) Export `parser` from `@fossiq/kql-lezer` if needed (or re-parse within this package).
3) Implement CST utilities and top-level document + pipeline mapping.
4) Implement expressions and a few operators (`where`, `project`) to unblock `kql-to-duckdb`.
5) Adopt in `kql-to-duckdb` behind a flag, then migrate fully.

---

## Definition of Done (Package)

- [ ] New package builds and publishes in the monorepo workspace.
- [ ] `parseToAST` produces `@fossiq/kql-ast` nodes for the supported subset.
- [ ] Golden tests exist and cover operators + expressions.
- [ ] Conversion errors are descriptive and include source positions.
- [ ] Documented scope + known unsupported constructs in package README.
