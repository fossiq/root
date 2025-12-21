# @fossiq/kql-lezer Agent Guide

## Purpose

- Lezer grammar + CodeMirror language support for KQL. Optimized for incremental editor feedback and compatible with `@fossiq/kql-ast` types.

## Structure

```
packages/kql-lezer/
├── src/kql.grammar     # Authoritative grammar
├── src/parser.ts       # Generated (committed, @ts-nocheck)
├── src/parser.terms.ts # Generated terms
├── src/index.ts        # Language + helpers
├── scripts/fix-parser-types.*
├── tests/*             # 77 vitest suites
└── package.json
```

## Commands

- Install deps at repo root: `bun install`.
- Build (generate parser + tsc): `bun run build`.
- Grammar-only rebuild: `bun run build:grammar` (runs lezer-generator + fix parser banner).
- Tests: `bun run test` (Vitest) or `bun run test --watch` while iterating.

## Workflow

1. Edit `src/kql.grammar` for new syntax/operators.
2. Run `bun run build:grammar` to regenerate `parser.ts`/`parser.terms.ts` and apply `@ts-nocheck` via `scripts/fix-parser-types.*`.
3. Update `src/index.ts` for new exports/highlighting hooks.
4. Add/adjust tests under `tests/` before landing changes.
5. Run `bun run test` to keep 77 suites passing.

## Highlights & Status (2025-12-09)

- Phase: Grammar + CodeMirror integration complete; polishing highlighting contrast.
- Completed: full operator coverage (where/project/extend/sort/limit/take/top/distinct/summarize), LRLanguage + `kql()` LanguageSupport, AST + highlight token extractors, `@ts-nocheck` automation.
- In progress: Improve syntax highlight contrast.

## Recent Learnings (2025-12-09)

- Regex generator now emits literal `.` as quoted tokens and serializes macros via native `@macros`, eliminating downstream hacks in `build:grammar`.
- `src/kql-spec/features.ts` acts as the canonical inventory for gating grammar progress; keep generator + grammar tests aligned with it.
- `README.md` and `features-checklist.md` define the plugin roadmap; consult them before modifying grammar modules.

## Style & Constraints

- Pure functional TypeScript, no classes. Keep files under ~150 lines and split helpers when necessary.
- Keep grammar edits surgical; prefer one operator/feature per change.
- Ensure generated files stay committed (editor consumers rely on them).

## Documentation

- Development guide: `packages/kql-lezer/docs/kql-lezer-dev.md`
- Status & checklist: `packages/kql-lezer/docs/kql-lezer-status.md`
- Record UI/editor gotchas (contrast, CodeMirror quirks) so downstream packages adjust.

## Coordination

- Sync API or highlight tag changes with `@fossiq/ui`. Any AST structure changes must stay compatible with `@fossiq/kql-ast` consumers.

## TODO

- After implementing regex backslash escaping and quote handling improvements in `@fossiq/lezer-grammar-generator`, update `packages/kql-lezer/src/grammar/plugins/tokens/literals.ts` to re-enable escaped string patterns using `regex(/"([^"\\]|\\.)*"/)` and `regex(/'([^'\\]|\\.)*'/ )` instead of limiting to verbatim strings only.
