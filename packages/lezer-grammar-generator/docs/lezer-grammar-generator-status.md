# Lezer Grammar Generator Status

Scope: library that generates Lezer `.grammar` text from config (no `.grammar` parsing or parser generation).

Legend:

- `[x]` Implemented in this package
- `[/]` Passthrough (you can write raw Lezer grammar syntax in strings; only best-effort validation)
- `[ ]` Not implemented

## Status Checklist

- [x] GrammarDefinition API (`generateLezerGrammar`)
- [x] Validation with structured issues (`validateGrammar`)
- [x] Deterministic serialization order
- [x] PatternExpression helpers (`literal`, `regex`, `ref`, `seq`, ...)
- [x] Output `.grammar` string (`generateGrammar`)
- [x] Plugin merge + DAG ordering (`generateGrammarFromPlugins`)
- [x] Default tokens + token override by name
- [x] Custom tokens (raw patterns)
- [x] Token specialization via `TokenDefinition.specialized` (`@specialize`)
- [x] `@skip { whitespace | LineComment }` (global)
- [x] `@precedence` from explicit token list or numeric rule precedence
- [x] Macros emitted verbatim
- [x] PatternExpression helpers (`literal`, `regex`, `ref`, `seq`, `choice`, ...)
- [/] Rule syntax/features beyond the generator model (still passthrough via `grammarFields`; best-effort safety via `validation.mode`)
- [x] Basic validation that fills `errors` (required fields, duplicates, precedence references)
- [x] Configurable passthrough safety checks (`validation.mode`: `off`/`basic`/`strict`)

## “Feature Complete”?

For the current scope (generate `.grammar` text), it’s feature complete. Remaining work is optional ergonomics (more helpers) and deeper validation if desired.
