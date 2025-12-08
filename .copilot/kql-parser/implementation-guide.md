# KQL Parser: Implementation Guide

## Adding a New Operator (Step-by-Step)

### 1. Define Types (`src/types.ts`)

```typescript
export interface NewOperatorClause {
  type: "new_operator_clause";
  items: ItemType[];
  by?: Expression;
}

// Add to unions
export type ASTNode /* ... */ = NewOperatorClause;
export type Operator /* ... */ = NewOperatorClause;
```

### 2. Add Grammar Rules (`src/grammar/rules.ts`)

```typescript
export const newOperatorClause: RuleFunction = ($) =>
  seq("keyword", $.item_list, optional(seq("by", $.expression)));

export const itemList: RuleFunction = ($) =>
  seq($.item, repeat(seq(",", $.item)));
```

### 3. Register Rules (`src/grammar/index.ts`)

```typescript
rules: {
  // ... existing rules
  new_operator_clause: rules.newOperatorClause($),
  item_list: rules.itemList($),
}
```

Add to operator choice in `rules.ts`:

```typescript
export const operator: RuleFunction = ($) =>
  choice(
    // ... existing
    $.new_operator_clause,
  );
```

### 4. Create Builders (`src/builders/operators.ts`)

```typescript
export function buildNewOperatorClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => any,
): NewOperatorClause {
  const list = node.children.find((c) => c.type === "item_list");
  if (!list) throw new Error("Missing item list");

  const items = [];
  for (let i = 0; i < list.childCount; i++) {
    const child = list.child(i);
    if (child && child.type !== ",") {
      items.push(buildAST(child));
    }
  }

  const byIndex = node.children.findIndex((c) => c.text === "by");
  let byExpression: Expression | undefined;
  if (byIndex !== -1) {
    const expr = node.children[byIndex + 1];
    if (expr) byExpression = buildAST(expr);
  }

  return { type: "new_operator_clause", items, by: byExpression };
}
```

### 5. Wire Up Builder (`src/builders/index.ts`)

```typescript
import { buildNewOperatorClause } from "./operators.js";

export function buildAST(node: SyntaxNode): ASTNode {
  switch (node.type) {
    // ... existing cases
    case "new_operator_clause":
      return buildNewOperatorClause(node, buildAST);
  }
}
```

### 6. Add Tests (`scripts/test-grammar.ts`)

```typescript
{ name: 'NewOp basic', query: 'Users | newop item1, item2' },
{ name: 'NewOp with by', query: 'Users | newop items by column' },
{ name: 'NewOp complex', query: 'Users | newop a = func() by col1, col2' },
```

### 7. Compile & Test

```bash
cd packages/kql-parser
bun run compile-grammar
bun x tree-sitter-cli generate  # Check for conflicts
bun run test-grammar  # Run directly without building
```

**Important:** Scripts in `scripts/` should be run directly with `bun scripts/<script>.ts` or via npm scripts. Do NOT run `bun run build` before testing - the TypeScript compiler will fail on scripts due to Bun-specific imports. Test the grammar first, then build if needed for distribution.

### 8. Update Documentation

- Mark checklist item [x] in `status.md`
- Add completion note with test count
- Document any gotchas discovered

### 8. Update Status & Ask Before Next Feature

- Update `.copilot/kql-parser/status.md` with:
  - New test count
  - Completed feature details (types, grammar, builders, tests)
  - Mark checklist item as [x]
- **Always ask the user** before implementing the next feature

## Common Patterns

### Assignment Pattern (name = value)

```typescript
const hasAssignment = node.children.some((c) => c.text === "=");
if (hasAssignment) {
  const name = node.child(0);
  const value = node.child(2); // index 1 is '='
  // handle named
} else {
  // handle unnamed
}
```

### Expression Lists

```typescript
export const expressionList: RuleFunction = ($) =>
  seq($.expression, repeat(seq(",", $.expression)));
```

### Finding Nodes

```typescript
// By type
const part = node.children.find((c) => c.type === "expected_type");

// By text
const keyword = node.children.findIndex((c) => c.text === "keyword");

// Iterate with skip
for (let i = 0; i < list.childCount; i++) {
  const child = list.child(i);
  if (child && child.type !== ",") {
    // Skip separators
    items.push(buildAST(child));
  }
}
```

## Troubleshooting

**Undefined symbol:** Check rule is exported from `rules.ts` and added to `index.ts`

**Parse errors:** Run `tree-sitter parse query.kql` to see parse tree with (ERROR) nodes

**Conflicts:** Use `prec.dynamic()` or add to `conflicts` array in `index.ts`

## Grammar Combinators

- `seq(...)` - Sequence
- `choice(...)` - Alternatives
- `optional(...)` - Optional
- `repeat(...)` - Zero or more
- `prec.left(n, rule)` - Left precedence
- `prec.dynamic(n, rule)` - Dynamic precedence
