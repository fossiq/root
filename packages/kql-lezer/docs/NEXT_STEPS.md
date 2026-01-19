# KQL Parser: Next Steps for Feature Completeness

This guide outlines the remaining tasks to align the `@fossiq/kql-lezer` parser with the `kql_parser_implementation_guide.md`. These tasks are prioritized by impact on valid KQL query support.

## 1. Missing Tabular Operators

These operators are standard in KQL but currently missing from the grammar.

### 1.1 Range Operator (`range`)

- **Grammar**: `range Identifier from Expression to Expression step Expression`
- **Location**: `src/grammar/plugins/rules/data-operators.ts`
- **AST Mapping**: Needs new `RangeOperator` type in AST and `mapRangeOperator` in `cst-to-ast`.
- **Example**: `range x from 1 to 10 step 1`
- [x] Implemented

### 1.2 As Operator (`as`)

- **Grammar**: `as [hint.materialized=boolean] Identifier`
- **Location**: `src/grammar/plugins/rules/misc-operators.ts`
- **AST Mapping**: Needs `AsOperator` type.
- **Example**: `T | as T_copy`
- [x] Implemented

### 1.3 Mv-Apply (`mv-apply`)

- **Grammar**: `mv-apply [Col1, Col2] on ( SubQuery )`
- **Location**: `src/grammar/plugins/rules/standard-operators.ts` (or similar)
- **Complexity**: High. Similar to `partition` or `make-series`, it involves a sub-pipeline context.

### 1.4 External Data (`externaldata`)

- **Grammar**: `externaldata (Schema) [ ListOfUrls ] [with (Props)]`
- **Location**: `src/grammar/plugins/rules/data-operators.ts`
- **Note**: Important for ad-hoc data analysis.

## 2. Expression & Operator Enhancements

### 2.1 String & Collection Operators

Add the following to `StringOp` in `src/grammar/plugins/rules/expressions.ts` and `keywordTokens` in `tokens/keywords.ts`:

- `has_all`, `has_any`
- `has_ipv4`, `has_ipv4_prefix`, `has_any_ipv4`
- `matches regex` (check if fully supported)

### 2.2 Table Source Expansion

The `TableExpression` rule in `src/grammar/plugins/rules/pipeline.ts` is too restrictive. It must support:

- **Function Calls**: `MyFunction() | ...` or `range(...) | ...` (if range is treated as a function source).
- **Qualified Names**: `database("db").Table` or `cluster("c").database("d").Table`.
- **Dotted Identifiers**: `Table.Column` (though usually this resolves to just `Table`).

**Action**:

1. Update `TableExpression` choice to include `FunctionCall`.
2. Add a `QualifiedEntity` rule: `Identifier (Dot Identifier)+` or `FunctionCall (Dot Identifier)*`.

## 3. CST-to-AST Mapping Refinement

### 3.1 Search & Find

- **Current Status**: Grammar consumes tokens generically; AST mapper is a placeholder.
- **Task**: Implement robust parsing in `src/parser/cst-to-ast/index.ts` to extract:
  - Search text terms.
  - Table scope (`in (T1, T2)`).
  - Options (`kind=...`).

### 3.2 Join & Union

- **Union**: Verify `mapUnionClause` correctly handles mixed table refs and pipe sources.
- **Join**: Ensure all `kind` flavors are mapped correctly to AST enum values.

## 4. AST Type Definitions

The `@fossiq/kql-ast` package might need updates to support these new nodes.

- **Check**: `RangeOperator` ✅, `AsOperator` ✅, `ExternalDataOperator`.
- **Action**: Add interfaces to `packages/kql-ast/src/index.ts` if missing.

## 5. Testing

- [x] **New Tests**: Create `tests/missing_features.test.ts`.
- **Cases**:
  - [x] `range x from 1 to 5 step 1`
  - [x] `T | as T2`
  - [ ] `print has_all("a", dynamic(["a", "b"]))`
  - [ ] `database("db").Table | count`

## Implementation Order

1. **Easy Wins**: Add `range`, `as`, and missing string operators (`has_all`, etc.).
2. **Core Fix**: Expand `TableExpression` to support function calls and qualified names.
3. **Complex**: Implement `mv-apply` and `externaldata`.
4. **Refinement**: Flesh out `search`/`find` AST mapping.
