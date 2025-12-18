# Lezer Grammar Generator Status

Scope: library that generates Lezer `.grammar` text from config (no `.grammar` parsing or parser generation).

Legend:

- `[x]` Implemented in this package
- `[/]` Passthrough (you can write raw Lezer grammar syntax in strings; no validation)
- `[ ]` Not implemented

## Status Checklist

- [x] Output `.grammar` string (`generateGrammar`)
- [x] Default tokens + token override by name
- [x] Custom tokens (raw patterns)
- [x] Token specialization via `TokenDefinition.specialized` (`@specialize`)
- [x] `@skip { whitespace | LineComment }` (global)
- [x] `@precedence` from explicit token list or numeric rule precedence
- [x] Macros emitted verbatim
- [/] Rule syntax/features beyond the generator model (passthrough via `grammarFields`)
- [ ] Deep validation / conflict detection (`errors` is currently always empty)

## “Feature Complete”?

For the current scope (generate `.grammar` text), it’s mostly complete. The main gap is basic validation that fills `errors`.
