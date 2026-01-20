# How To: Debug the KQL Lezer Grammar Build

This guide documents the working dev loop for diagnosing grammar generation
errors in `@fossiq/kql-lezer` and the generator output in
`@fossiq/lezer-grammar-generator`.

## Prereqs

- `bun` installed (workspace uses Bun).
- Run commands from the repo root unless noted.

## 1) Rebuild the grammar generator

From `packages/lezer-grammar-generator`:

```bash
bun run build
```

This updates `dist/` so `@fossiq/kql-lezer` consumes the latest generator.

## 2) Regenerate the .grammar file

From `packages/kql-lezer`:

```bash
bun scripts/generate-kql-grammar.ts
```

This writes `src/kql.grammar`.

## 3) Run the Lezer generator

From `packages/kql-lezer`:

```bash
bun run build:grammar
```

This invokes `lezer-generator` to emit `src/parser.ts`.

## 4) Inspect failures in the generated grammar

When `lezer-generator` fails, use the reported line/column to inspect the
generated grammar:

```bash
nl -ba src/kql.grammar | sed -n 'LINE_START,LINE_ENDp'
```

Map errors back to plugin sources in `src/grammar/plugins/`.

## Common failure patterns and fixes

### A) "Overlapping character range" or token overlap errors

Cause:
- Tokens overlap in the same context (e.g., `Identifier` vs `String` when
  strings start with `h"`).

Fix:
- Add token precedence in `coreGrammar`:
  - `tokenPrecedence: ["String", "Identifier"]`
- Confirm the `@tokens` block renders `@precedence { String, Identifier }`.

### B) "@ without a name" in a String token

Cause:
- String patterns using `@"..."` or `@'...'` are emitted as `@` in token
  syntax instead of a literal `@`.

Fix:
- Use `raw(...)` patterns that express `@` as a literal token string:
  - Example: `raw(String.raw\`"@" "\"" !["]* "\""\`)`

### C) "specialize must be a literal"

Cause:
- `@specialize` receives an unquoted identifier (`let`, `where`).

Fix:
- Use the `kw(...)` helper and ensure it emits quoted literals:
  - Macro: `@specialize[@name={term}]<Identifier, "{term}">`

### D) Tokens or rules render empty (`{ }`)

Cause:
- Eta templates using `<%- ... %>` do not emit output with the current
  generator bundling config.

Fix:
- Use `<%= ... %>` for output in:
  - `src/templates/sections/tokens.eta`
  - `src/templates/sections/local-tokens.eta`
  - `src/templates/sections/rules.eta`
  - `src/templates/sections/skip.eta`

## Verify the output

After fixes, regenerate and compile:

```bash
bun scripts/generate-kql-grammar.ts
bun run build:grammar
```

If the grammar compiles, `src/parser.ts` is updated and ready for tests.
