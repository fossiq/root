# Lezer Grammar Generator Plan (Fossiq)

Purpose: Ship a pure TypeScript package that converts a plain JS/TS grammar object into valid Lezer `.grammar` text. Scope is object -> string only (no stateful builder, no CLI). Keep it Bun-first and monorepo-friendly.

## Package Setup (packages/lezer-grammar-generator)
- [x] Name: @fossiq/lezer-grammar-generator
- [x] Entry points: main `dist/index.js`, types `dist/index.d.ts`, sideEffects: false
- [ ] Scripts (Bun):
  - [ ] build: `bun run tsc -b`
  - [ ] test: `bun run vitest run`
  - [ ] lint: `bun run eslint src --ext .ts`
- [ ] Dev deps: typescript, @types/node, vitest, eslint, @typescript-eslint/*
- [ ] tsconfig: extend root; `strict`, `declaration`, `composite`, `moduleResolution` matching repo
- [ ] Workspace wiring: add to workspaces + TS path aliases; output in `dist/`

## Data Model (plain objects)
- [x] GrammarDefinition (readonly): { name?, top?, tokens?, rules, precedence?, externals? }
- [x] PatternExpression union:
  - [x] literal {type: "literal", value}
  - [x] regex {type: "regex", pattern}
  - [x] ref {type: "ref", name, args?}
  - [x] seq {type: "seq", elements: PatternExpression[]}
  - [x] choice {type: "choice", alternatives: PatternExpression[]}
  - [x] repeat {type: "repeat", kind: "*"|"+", expr}
  - [x] optional {type: "optional", expr}
  - [x] group {type: "group", expr}
  - [x] raw {type: "raw", content} // escape hatch for advanced Lezer features
- [x] RuleDef: { expression: PatternExpression; params?: string[]; props?: Record<string, string|number|boolean> }
- [x] PrecedenceLevel: { name: string; associativity?: "left"|"right"|"none" }
- [x] All fields readonly to avoid mutation assumptions

## Public API
- [x] `generateLezerGrammar(def: GrammarDefinition): string`
- [x] `validateGrammar(def: GrammarDefinition): ValidationResult`
- [x] Optional pure helpers (no state): seq, choice, literal, regex, ref, optional, repeat, group, raw -> each returns a PatternExpression
- [x] No stateful builder; no CLI in v1

## Serialization (deterministic, stack-safe)
- [x] Deterministic order: @tokens (if any) -> @external (if any) -> @precedence (if any) -> @top (if set) -> rules (top first if provided, then alphabetical)
- [x] Iterative/stack-safe traversal (avoid deep recursion); depth guard with friendly error
- [x] Expression formatting:
  - [x] seq: `A B C`
  - [x] choice: `A | B | C`
  - [x] optional: `expr?`
  - [x] repeat: `expr*` / `expr+`
  - [x] group: `( expr )`
  - [x] literal: quoted with escapes
  - [x] regex: `/.../`
  - [x] ref with params: `Rule<Arg1, Arg2>`
  - [x] raw: inject content verbatim (trusted caller)
- [x] Rule props: serialize as `Rule[prop=value] { ... }`
- [x] Precedence block: `@precedence { left mult; right assign }` etc.
- [x] Stable spacing: two-space indent inside blocks; Unix newlines; blank lines between sections

## Validation (shape + references)
- [x] ValidationResult: { ok: boolean; issues: readonly {code, message, path?}[] }
- [x] Checks:
  - [x] rules present and non-empty; identifier pattern `^[A-Za-z_][A-Za-z0-9_]*$`
  - [x] undefined refs -> error
  - [x] duplicate names between tokens/rules -> error
  - [x] reserved names (@tokens, @precedence, @top) -> error
  - [x] params arity: ref args must match rule params length if specified
  - [x] cycle detection: DFS/Tarjan over rule refs -> warning unless caller opts to treat as error
  - [x] warn on unused rules (except top)
- [x] Symbol table for O(1) lookups; traversal O(n+e)

## Testing (Bun + Vitest)
- [x] Unit: expression helpers, identifier validation, params arity, cycle detection
- [x] Serialization golden tests: object -> exact .grammar string (fixtures)
- [x] Cover tokens, precedence, externals, props, raw, param rules
- [ ] Optional e2e (dev/CI only): run @lezer/generator on emitted grammar

## Documentation
- [x] README with purpose, install, minimal example, API surface, supported features, non-goals, Raw escape hatch
- [x] Examples: `examples/arithmetic.ts`, `examples/advanced-raw.ts`
- [x] JSDoc on public types/functions

## Non-Goals for v1
- [x] No stateful builder or fluent DSL
- [x] No CLI/binary
- [x] No file I/O in core (browser-safe)
- [x] No hidden magic to fix invalid grammars; validation reports issues only

## Follow-ups (optional later)
- [ ] CLI wrapper if requested
- [ ] Ergonomic builder wrapper that emits plain objects (stay stateless internally)
- [ ] Runtime schema validation (zod/io-ts) as optional dev helper
