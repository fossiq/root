# @fossiq/lezer-grammar-generator

TypeScript library for generating Lezer grammars from AST type definitions.

## Purpose

This package provides a programmatic way to generate Lezer grammar files from TypeScript AST type definitions, making it easier to maintain and evolve parser grammars alongside type definitions.

## Installation

```bash
bun add @fossiq/lezer-grammar-generator
```

## Usage

### Basic Example

```typescript
import { generateGrammar } from '@fossiq/lezer-grammar-generator';

const config = {
  grammarName: 'MyGrammar',
  astTypes: {
    statement: {
      grammarName: 'statement',
      grammarFields: 'expression',
      isRule: true
    },
    expression: {
      grammarName: 'expression',
      grammarFields: 'binaryExpression | literal',
      isRule: true,
      precedence: 1
    },
    binaryExpression: {
      grammarName: 'binaryExpression',
      grammarFields: 'expression ComparisonOp expression',
      isRule: true,
      precedence: 2
    },
    literal: {
      grammarName: 'literal',
      grammarFields: 'Number | String',
      isRule: true
    }
  },
  tokens: [
    {
      name: 'MyKeyword',
      pattern: '"mykeyword"'
    }
  ]
};

const result = generateGrammar(config);

if (result.errors.length === 0) {
  console.log(result.grammar);
  // Use the generated grammar with lezer-generator
} else {
  console.error('Errors:', result.errors);
}
```

### Generating a Grammar File

```typescript
import { writeFileSync } from 'fs';
import { generateGrammar } from '@fossiq/lezer-grammar-generator';

const config = { /* ... */ };
const result = generateGrammar(config);

if (result.errors.length === 0) {
  writeFileSync('my-grammar.grammar', result.grammar);
  console.log('Grammar file generated successfully!');
}
```

### CLI Tool

Create a script file:

```javascript
#!/usr/bin/env node
// generate-grammar.js
import { readFileSync } from 'fs';
import { generateGrammar } from '@fossiq/lezer-grammar-generator';

const config = JSON.parse(readFileSync('./grammar-config.json', 'utf8'));
const result = generateGrammar(config);

if (result.errors.length > 0) {
  console.error('Failed to generate grammar:', result.errors);
  process.exit(1);
}

console.log(result.grammar);
```

Then run it:

```bash
node generate-grammar.js > my-grammar.grammar
```

## API Reference

### `generateGrammar(config: GrammarGeneratorConfig): GeneratedGrammar`

Generates a Lezer grammar from the provided configuration.

#### `GrammarGeneratorConfig`

- `grammarName`: Name of the grammar (used for `@top` rule)
- `astTypes`: Object mapping AST type names to `ASTTypeDefinition`
- `tokens`: Optional array of custom `TokenDefinition`s
- `skipWhitespace`: Whether to generate `@skip { whitespace | LineComment }` (default: `true`)

#### `ASTTypeDefinition`

- `grammarName`: Rule name in the generated grammar
- `grammarFields`: Grammar rule fields definition
- `isRule`: Whether this type should generate a grammar rule
- `precedence`: Optional precedence level for `@precedence` section

#### `TokenDefinition`

- `name`: Token name
- `pattern`: Token pattern string
- `specialized`: Optional specialization configuration

#### `GeneratedGrammar`

- `grammar`: The generated grammar string
- `imports`: List of imports needed (currently empty, reserved for future use)
- `errors`: List of validation errors

## Default Tokens

The generator automatically includes these tokens:

- **Delimiters**: `Pipe`, `OpenParen`, `CloseParen`, `OpenBracket`, `CloseBracket`, `Comma`, `Semicolon`, `Equals`
- **Math operators**: `Plus`, `Minus`, `Star`, `Slash`, `Percent`
- **Comparison operators**: `ComparisonOp`
- **Basic tokens**: `Identifier`, `Number`, `String`
- **Comments**: `LineComment`, `whitespace`

## Integration with @fossiq/kql-ast

This package can be used with `@fossiq/kql-ast` to generate grammars from KQL AST types:

```typescript
import { generateGrammar } from '@fossiq/lezer-grammar-generator';
import type { 
  KQLDocument, 
  QueryStatement, 
  TabularStatement,
  // ... other types
} from '@fossiq/kql-ast';

// Build config from kql-ast types
const config = {
  grammarName: 'Query',
  astTypes: {
    statement: {
      grammarName: 'statement',
      grammarFields: 'pipelineExpression | letStatement',
      isRule: true
    },
    // ... map other types
  }
};
```

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