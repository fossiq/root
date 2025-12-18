# Lezer Grammar Generator Spec

This package is a **library** that takes a JS/TS config and returns Lezer `.grammar` source text.

## Scope

- Generate a complete `.grammar` string with:
  - `@top` rule
  - rule definitions
  - `@tokens` (defaults + custom)
  - optional `@precedence`
  - optional `@skip`
  - optional macros

Non-goals:

- Parsing `.grammar` files
- Running `@lezer/generator` / producing `LRParser`
- Conflict detection / GLR diagnostics

## Inputs

The public surface is `generateGrammar(config)`, where `config` includes:

- `grammarName: string`
- `astTypes: Record<string, { grammarName; grammarFields; isRule?; precedence? }>`
- `tokens?: Array<{ name; pattern; specialized? }>`
- `precedence?: string[]` (token precedence list)
- `skipWhitespace?: boolean` (default `true`)
- `macros?: Record<string, string>`

## Defaults

If not overridden by a custom token with the same name, the generator emits defaults for:
`Pipe`, `OpenParen`, `CloseParen`, `OpenBracket`, `CloseBracket`, `Comma`, `Semicolon`, `Equals`,
`Plus`, `Minus`, `Star`, `Slash`, `Percent`,
`ComparisonOp`, `Identifier`, `Number`, `String`, `LineComment`, `whitespace`.

## Checklist

### Grammar Generation

- [x] Generate `@top`
- [x] Generate rules from `astTypes` where `isRule`
- [x] Generate default tokens + custom tokens
- [x] Generate `@skip` (global) when `skipWhitespace !== false`
- [x] Generate `@precedence` from `config.precedence` or numeric rule precedence
- [x] Emit macros verbatim

### Nice-To-Haves (Not Required For Scope)

- [x] Populate `errors` with meaningful validation (duplicates, missing start rule, unknown precedence tokens)
- [x] More structured helpers for common Lezer constructs (lists, keywords, etc.)
