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
- [x] Structured helper functions for composing `grammarFields` (`seq`, `choice`, `opt`, `separatedList`, `kw`, ...)
- [/] Rule syntax/features beyond the generator model (passthrough via `grammarFields`)
- [x] Basic validation that fills `errors` (required fields, duplicates, precedence references)

## “Feature Complete”?

For the current scope (generate `.grammar` text), it’s feature complete. Remaining work is optional ergonomics (more helpers) and deeper validation if desired.
