# Lezer Grammar Generator Spec

This package is a **library** that takes a JS/TS config and returns Lezer
`.grammar` source text.

## Scope

- Generate a complete `.grammar` string with:
  - `@tokens` block
  - optional `@external` block
  - optional `@precedence` block
  - optional `@top` rule
  - rule definitions
- Validation for shape + references

Non-goals:

- Parsing `.grammar` files
- Running `@lezer/generator` / producing `LRParser`
- Conflict detection / GLR diagnostics

## Inputs (GrammarDefinition API)

The primary surface is:

- `generateLezerGrammar(def: GrammarDefinition): string`
- `validateGrammar(def: GrammarDefinition): ValidationResult`

`GrammarDefinition` includes:

- `name?: string`
- `top?: string`
- `tokens?: Array<{ name; pattern }>`
- `rules: Record<string, RuleDef>`
- `precedence?: Array<{ name; associativity? }>`
- `externals?: string[]`

`RuleDef` includes:

- `expression: PatternExpression`
- `params?: string[]`
- `props?: Record<string, string | number | boolean>`

`PatternExpression` supports:

- `literal`, `regex`, `ref`, `seq`, `choice`, `repeat`, `optional`, `group`, `raw`

## Serialization

Deterministic ordering:

1. `@tokens`
2. `@external` (if any)
3. `@precedence` (if any)
4. `@top` (if any)
5. rules (top rule first if provided, then alphabetical)

Formatting:

- Two-space indent in blocks
- Unix newlines
- Blank line between sections

## Validation

`ValidationResult` includes:

- `ok: boolean`
- `issues: Array<{ code; message; path?; level }>`

Checks:

- rules present and non-empty
- identifier pattern `^[A-Za-z_][A-Za-z0-9_]*$`
- undefined references -> error
- duplicate names between tokens/rules -> error
- reserved names (`@tokens`, `@precedence`, `@top`) -> error
- ref arity matches rule params length -> error
- cycles -> warning
- unused rules (except top) -> warning

## Legacy Inputs (String-Based)

The legacy surface remains for AST-style configs:

- `generateGrammar(config)`
- `generateGrammarFromPlugins(config)`

Legacy config supports `macros`, `@skip`, default tokens, and passthrough
validation modes (`off`/`basic`/`strict`).
