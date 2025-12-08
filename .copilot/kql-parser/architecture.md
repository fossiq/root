# KQL Parser Architecture

## Structure

```
packages/kql-parser/
├── src/
│   ├── grammar/              # TypeScript grammar (compiled to JS)
│   │   ├── types.ts          # Tree-sitter type definitions
│   │   ├── helpers.ts        # Grammar combinators
│   │   ├── rules.ts          # KQL grammar rules
│   │   ├── index.ts          # Grammar config & registration
│   │   └── compile.ts        # TS → JS compiler
│   ├── builders/             # AST builders (tree-sitter → typed AST)
│   │   ├── literals.ts       # Basic values
│   │   ├── expressions.ts    # Operations
│   │   ├── operators.ts      # KQL operators
│   │   ├── statements.ts     # Top-level constructs
│   │   └── index.ts          # Builder orchestration
│   ├── types.ts              # AST type definitions
│   └── index.ts              # Public API
├── scripts/
│   └── test-grammar.ts       # Grammar test runner
└── grammar.js                # Generated tree-sitter grammar
```

## Core Principles

1. **Separation of Concerns:** Grammar → Types → Builders → API
2. **Functional:** Pure functions, no classes
3. **Type Safety:** Discriminated unions, explicit types

## Grammar System

**TypeScript Grammar → JavaScript Grammar → C Parser**

1. Write rules in `src/grammar/rules.ts` (camelCase)
2. Register in `src/grammar/index.ts` (snake_case)
3. Compile: `bun run compile-grammar` → `grammar.js`
4. Generate: `bun x tree-sitter-cli generate` → C parser

**Naming:** TS `summarizeClause` → Grammar `summarize_clause`

## Type System

Discriminated unions for AST nodes:

```typescript
export type ASTNode = SourceFile | Operator | Expression | Literal;
export type Operator = WhereClause | ProjectClause | SummarizeClause;

export interface SummarizeClause {
  type: 'summarize_clause';  // Discriminator
  aggregations: AggregationExpression[];
  by?: Expression[];         // Optional with ?
}
```

## Builder Pattern

Convert tree-sitter `SyntaxNode` → typed AST:

```typescript
export function buildSummarizeClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => any
): SummarizeClause {
  // 1. Find child nodes
  const list = node.children.find(c => c.type === 'aggregation_list');
  
  // 2. Build children recursively
  const aggregations = [];
  for (let i = 0; i < list.childCount; i++) {
    const child = list.child(i);
    if (child && child.type === 'aggregation_expression') {
      aggregations.push(buildAggregationExpression(child, buildAST));
    }
  }
  
  // 3. Return typed node
  return { type: 'summarize_clause', aggregations };
}
```

**Organization:**
- `literals.ts` - Identifier, string, number, boolean, null
- `expressions.ts` - Binary, comparison, arithmetic, string, in, between
- `operators.ts` - Where, project, extend, summarize, sort, etc.
- `statements.ts` - Source file, query, pipe

## Build Flow

```
Edit src/grammar/rules.ts
  ↓
bun run compile-grammar → grammar.js
  ↓
bun x tree-sitter-cli generate → parser (C code)
  ↓
bun run build → TypeScript compilation
  ↓
bun run test-grammar → validate
```

## Testing

Grammar tests parse queries with tree-sitter CLI and check for (ERROR) nodes:

```typescript
const testCases = [
  { name: 'Test name', query: 'Users | summarize count() by country' },
];

// For each: parse with tree-sitter, check output for errors
```

## Key Patterns

**Lists with separators:**
```typescript
for (let i = 0; i < list.childCount; i++) {
  const child = list.child(i);
  if (child && child.type !== ',') {  // Skip separators
    items.push(buildAST(child));
  }
}
```

**Optional parts:**
```typescript
const byIndex = node.children.findIndex(c => c.text === 'by');
if (byIndex !== -1) {
  const expr = node.children[byIndex + 1];
  if (expr) optional = buildAST(expr);
}
```

**Assignment detection:**
```typescript
const hasAssignment = node.children.some(c => c.text === '=');
if (hasAssignment) {
  name = node.child(0);
  value = node.child(2);  // index 1 is '='
}
```

## Dependencies

- **tree-sitter** - Parser generator & runtime
- **tree-sitter-cli** - Dev tool (testing)
- **TypeScript** - Type safety
- **Bun** - Runtime & package manager
