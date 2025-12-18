# @fossiq/lezer-grammar-generator

Generate Lezer `.grammar` source text from a JS/TS config.

## What This Package Does

- Input: a plain object describing rules, tokens, precedence, skip, and macros
- Output: a `.grammar` file as a string

Non-goals:

- Running `@lezer/generator` / `lezer-generator`
- Producing a parser module (`parser.ts`/`parser.js`)
- Grammar conflict detection / deep validation

## Installation

```bash
bun add @fossiq/lezer-grammar-generator
```

## Usage

```typescript
import { generateGrammar, p, literal } from "@fossiq/lezer-grammar-generator";

const config = {
  grammarName: "MyGrammar",
  astTypes: {
    statement: {
      grammarName: "statement",
      grammarFields: "expression",
      isRule: true,
    },
    expression: {
      grammarName: "expression",
      grammarFields: "binaryExpression | literal | identifier",
      isRule: true,
      precedence: 1,
    },
    binaryExpression: {
      grammarName: "binaryExpression",
      grammarFields: "expression ComparisonOp expression",
      isRule: true,
      precedence: 2,
    },
    identifier: {
      grammarName: "identifier",
      grammarFields: "Identifier",
      isRule: true,
    },
    literal: {
      grammarName: "literal",
      grammarFields: "Number | String",
      isRule: true,
    },
  },
  tokens: [
    {
      name: "MyKeyword",
      pattern: literal("mykeyword"),
    },
    {
      name: "DateTimeLiteral",
      pattern: p`"datetime(" $[ \t\n\r]* $[0-9]+ "-" $[0-9]+ "-" $[0-9]+ $[ \t\n\r]* ")"`,
    },
  ],
  macros: {
    "kw<term>": "@specialize[@name={term}]<Identifier, term>",
  },
};

const result = generateGrammar(config);

if (result.errors.length === 0) {
  // Write `result.grammar` to `*.grammar` and run `lezer-generator` in your build.
  console.log(result.grammar);
} else {
  console.error("Errors:", result.errors);
}
```

## API

### `generateGrammar(config)`

- Returns `{ grammar: string; imports: string[]; errors: string[] }`.
- `errors` includes basic validation failures (missing required fields, duplicates, unknown precedence tokens).

### Helpers

- `literal(text)` -> JSON-escaped Lezer string literal (e.g. `"project-away"`)
- `p\`...\``->`String.raw` helper for writing Lezer token patterns/macros with fewer escaping issues

## Default Tokens

The generator automatically includes these tokens:

- **Delimiters**: `Pipe`, `OpenParen`, `CloseParen`, `OpenBracket`, `CloseBracket`, `Comma`, `Semicolon`, `Equals`
- **Math operators**: `Plus`, `Minus`, `Star`, `Slash`, `Percent`
- **Comparison operators**: `ComparisonOp`
- **Basic tokens**: `Identifier`, `Number`, `String`
- **Comments**: `LineComment`, `whitespace`

## Integration With `@fossiq/kql-ast`

Use `@fossiq/kql-ast` as the source of names/types and map them into `astTypes` + `grammarFields`.

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
