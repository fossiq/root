# @fossiq/lezer-grammar-generator Agent Notes

## Scope

Pure TypeScript library that turns plain JS/TS grammar objects into Lezer
`.grammar` text. No CLI, no file I/O, no parser generation.

## Key Files

- `src/model.ts`: GrammarDefinition + PatternExpression types
- `src/serialize.ts`: `generateLezerGrammar` (deterministic serialization)
- `src/validate.ts`: `validateGrammar` (shape + ref checks)
- `src/generator.ts`: legacy AST-based generator + plugin merge
- `src/helpers.ts`: PatternExpression helper constructors
- `src/legacy-helpers.ts`: legacy string helpers (`legacy` namespace export)
- `tests/`: Bun tests

## Runtime & Commands

- Use Bun: `bun test tests`, `bun run build`
- Keep helpers pure; avoid stateful builders.

## Conventions

- Deterministic output: tokens -> precedence -> top -> rules
- Two-space indent in blocks, Unix newlines
- Validation returns structured issues (errors vs warnings)
