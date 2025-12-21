# @fossiq/kql-lezer Agent Guide

## Purpose

- Chevrotain-based parser + CodeMirror language support for KQL. Optimized for editor feedback and compatible with `@fossiq/kql-ast` types.

## Parser Generator Switch

Completed switch from Lezer to Chevrotain due to critical tool limitations:
- lezer-generator doesn't support @macros or overlapping tokens, preventing complex grammars.
- Chevrotain provides full JS control, better error handling, and easier maintenance.
- Updated generator to expand macros instead of outputting @macros.
- Implemented Chevrotain lexer and parser for KQL with basic tokenization and parsing.

## Structure

```
packages/kql-lezer/
├── src/lexer.ts        # Chevrotain token definitions and lexer
├── src/parser.ts       # Chevrotain parser definition
├── src/index.ts        # Parsing functions and token extraction
├── tests/*             # Vitest suites
└── package.json
```

## Commands

- Install deps at repo root: `bun install`.
- Build: `bun run build` (TypeScript compilation).
- Tests: `bun run test` (Vitest) or `bun run test --watch` while iterating.

## Workflow

1. Edit `src/lexer.ts` for token changes.
2. Edit `src/parser.ts` for grammar rule changes.
3. Update `src/index.ts` for parsing/highlighting logic.
4. Add/adjust tests under `tests/` before landing changes.
5. Run `bun run test` to ensure suites pass.

## Highlights & Status

- Phase: Parser + CodeMirror integration in progress.
- Completed: Switched to Chevrotain for full control over parsing.
- In progress: Implement KQL grammar in Chevrotain, integrate with CodeMirror.

## Learnings

- Lezer's lezer-generator has limitations with @macros and overlapping tokens, leading to Chevrotain switch.
- Chevrotain offers better control over parsing, clearer error messages, and easier testing.
- Updated lezer-grammar-generator to expand macros at generation time instead of outputting @macros.
- Chevrotain requires separate lexer and parser definitions, providing more explicit control.

## Style & Constraints

- Follow Chevrotain conventions: separate lexer (tokens) and parser (rules).
- Use meaningful token/rule names; keep implementations clear.
- Test changes thoroughly; Chevrotain provides detailed error diagnostics.

## Documentation

- Parser implementation: `src/parser.ts` and `src/lexer.ts`.
- Status & checklist: `packages/kql-lezer/docs/kql-lezer-status.md`.
- Record CodeMirror integration notes and parsing quirks.

## Coordination

- Sync token extraction with `@fossiq/ui` for highlighting.
- Future: Implement CST-to-AST conversion for `@fossiq/kql-ast` compatibility.

