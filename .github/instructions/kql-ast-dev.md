# @fossiq/kql-ast Development Guide

Shared KQL AST type definitions for multiple parser implementations. Provides a language-agnostic interface that both tree-sitter and Lezer parsers can implement.

## Purpose

- **Type Safety**: Define KQL AST structure once, use everywhere
- **Parser Agnostic**: Multiple parsers (tree-sitter, Lezer, etc.) can implement the same interface
- **Syntax Highlighting**: Shared token types for CodeMirror extensions
- **Ecosystem**: Enable tools, analyzers, and transformers to work with any parser

## Package Structure

```
packages/kql-ast/
├── src/
│   └── index.ts          # Core AST and token type definitions
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Core Types

### AST Nodes

- **ASTNode**: Base interface with position tracking (start, end)
- **KQLDocument**: Root node of parsed KQL query
- **QueryStatement**: Top-level query with optional let statements
- **TabularStatement**: Table reference + operators (where, select, etc.)
- **Expression**: Binary, unary, function calls, identifiers, literals

### Token Types

For syntax highlighting:
- Keywords, identifiers, operators, literals, comments, punctuation
- Semantic categories: FunctionName, ColumnName, TableName, etc.

### Parser Interface

```typescript
interface ParseResult {
  ast?: KQLDocument;
  tokens?: HighlightToken[];  // For syntax highlighting
  errors: ParseError[];
}
```

## Design Principles

1. **Language Agnostic**: Types don't depend on tree-sitter or Lezer
2. **Position Tracking**: All nodes include byte offsets (start, end)
3. **Extensible**: Parsers can add custom properties via `type` string field
4. **Minimal**: Only essential properties, avoid parser-specific details
5. **Complementary**: Works alongside parser-specific AST representations

## Usage by Other Packages

### kql-parser (tree-sitter)

```typescript
import type { ParseResult, KQLDocument } from "@fossiq/kql-ast";

export function parseKQL(input: string): ParseResult {
  const tree = treeSitterParser.parse(input);
  return {
    ast: convertToCommonAST(tree),
    errors: extractErrors(tree)
  };
}
```

### kql-lezer (Lezer)

```typescript
import type { ParseResult, HighlightToken } from "@fossiq/kql-ast";

export function parseKQL(input: string): ParseResult {
  const tree = parser.parse(input);
  return {
    ast: convertToCommonAST(tree),
    tokens: generateHighlightTokens(tree),
    errors: []
  };
}
```

## Implementation Status

- [x] Core AST type definitions
- [x] Token types for syntax highlighting
- [x] Parser result interface
- [ ] Testing
- [ ] Documentation examples
- [ ] Serialization utilities (if needed)

## Future Enhancements

- Visitor pattern for AST traversal
- AST transformation utilities
- Semantic analysis interfaces (scoping, type checking)
- Documentation comment parsing
