# @fossiq/lezer-grammar-generator

Generate Lezer `.grammar` source text from plain JS/TS objects.

## What This Package Does

- Input: a plain object describing rules, tokens, precedence, and externals
- Output: a `.grammar` file as a string

Non-goals:

- Running `@lezer/generator` / `lezer-generator`
- Producing a parser module (`parser.ts`/`parser.js`)
- Grammar conflict detection or GLR diagnostics

## Installation

```bash
bun add @fossiq/lezer-grammar-generator
```

## Usage (GrammarDefinition API)

```ts
import {
  generateLezerGrammar,
  validateGrammar,
  choice,
  literal,
  ref,
  regex,
  type GrammarDefinition,
} from "@fossiq/lezer-grammar-generator";

const def: GrammarDefinition = {
  name: "Query",
  top: "statement",
  tokens: [
    { name: "Identifier", pattern: regex("[A-Za-z_][A-Za-z0-9_]*") },
    { name: "Number", pattern: regex("[0-9]+") },
  ],
  precedence: [{ name: "mult", associativity: "left" }],
  rules: {
    statement: { expression: ref("expression") },
    expression: {
      params: ["T"],
      props: { kind: "expr", prec: 1 },
      expression: choice(ref("Number"), ref("Identifier")),
    },
  },
};

const validation = validateGrammar(def);
if (!validation.ok) {
  console.error(validation.issues);
} else {
  console.log(generateLezerGrammar(def));
}
```

## API

### `generateLezerGrammar(def)`

- Returns `.grammar` text as a string.
- Deterministic ordering: `@tokens` -> `@external` -> `@precedence` -> `@top` -> rules.

### `validateGrammar(def)`

- Returns `{ ok: boolean; issues: ValidationIssue[] }`.
- Issues include errors and warnings (cycles, unused rules).

### Helpers

- `literal`, `regex`, `ref`
- `seq`, `choice`, `repeat`, `optional`, `group`, `raw`
- Convenience: `many`, `many1`, `opt`, `separatedList`, `kw`, `kwRenamed`

## Legacy API (String-Based)

This package still ships the older generator for string-based configs:

- `generateGrammar(config)` with `GrammarGeneratorConfig`
- `generateGrammarFromPlugins(config)` with `GrammarPlugin`
- Legacy helpers are available under the `legacy` namespace (`legacy.p`, `legacy.literal`, `legacy.seq`, ...).

Validation mode can be tuned via `config.validation`:

- `off`: skip passthrough checks
- `basic` (default): delimiter/quote balance checks + macro invocation checks
- `strict`: also warns on unknown rule/token/macro references (use `allowUnknown`)

Default tokens (legacy generator):

- Delimiters: `Pipe`, `OpenParen`, `CloseParen`, `OpenBracket`, `CloseBracket`, `Comma`, `Semicolon`, `Equals`
- Math: `Plus`, `Minus`, `Star`, `Slash`, `Percent`
- Comparison: `ComparisonOp`
- Basic: `Identifier`, `Number`, `String`
- Comments: `LineComment`, `whitespace`

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## License

MIT
