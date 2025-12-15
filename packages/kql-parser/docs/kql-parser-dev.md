# KQL Parser Development Guide

## Structure

```
packages/kql-parser/
├── src/
│   ├── grammar/              # TypeScript grammar (compiled to JS)
│   │   ├── types.ts          # Tree-sitter type definitions
│   │   ├── helpers.ts        # Grammar combinators
│   │   ├── rules.ts          # KQL grammar rules
│   │   ├── index.ts          # Grammar config & registration
│   │   └── compile.ts        # TS -> JS compiler
│   ├── builders/             # AST builders (tree-sitter -> typed AST)
│   │   ├── literals.ts       # Basic values
│   │   ├── expressions.ts    # Operations
│   │   ├── operators.ts      # KQL operators
│   │   ├── statements.ts     # Top-level constructs
│   │   └── index.ts          # Builder orchestration
│   ├── types.ts              # AST type definitions
│   └── index.ts              # Public API
├── scripts/
│   ├── test-grammar.ts       # Grammar test runner
│   ├── build-binding.ts      # Build native bindings (cross-platform)
│   └── build-wasm.ts         # Build WASM (optional, requires Emscripten)
├── prebuilds/                # Pre-built native bindings
│   ├── linux-x64/
│   ├── linux-arm64/
│   ├── darwin-arm64/
│   └── win32-x64/
├── grammar.js                # Generated tree-sitter grammar
└── tree-sitter-kql.wasm      # Pre-built WASM binary (committed to repo)
```

## Build System

**No Docker Required for Development**

- **Native Bindings:** Built in CI for each platform, pre-built versions available
- **WASM:** Pre-built and committed to repo, optional to rebuild locally
- Local `bun build` only requires TypeScript compilation

**Build Scripts:**

- `bun run generate` - Compile grammar (no Docker needed)
- `bun run build:binding` - Build native bindings (platform-specific)
- `bun run build:wasm` - Build WASM (skipped if already exists; requires Emscripten if rebuilding)
- `bun run build` - Full build (TypeScript only for development)

## Core Principles

1. **Separation of Concerns:** Grammar -> Types -> Builders -> API
2. **Functional:** Pure functions, no classes
3. **Type Safety:** Discriminated unions, explicit types

## Grammar System

**TypeScript Grammar -> JavaScript Grammar -> C Parser**

1. Write rules in `src/grammar/rules.ts` (camelCase)
2. Register in `src/grammar/index.ts` (snake_case)
3. Compile: `bun run compile-grammar` -> `grammar.js`
4. Generate: `bun x tree-sitter-cli generate` -> C parser

**Naming:** TS `summarizeClause` -> Grammar `summarize_clause`

## Type System

Discriminated unions for AST nodes:

```typescript
export type ASTNode = SourceFile | Operator | Expression | Literal;
export type Operator = WhereClause | ProjectClause | SummarizeClause;

export interface SummarizeClause {
  type: "summarize_clause"; // Discriminator
  aggregations: AggregationExpression[];
  by?: Expression[]; // Optional with ?
}
```

## Builder Pattern

Convert tree-sitter `SyntaxNode` -> typed AST:

```typescript
export function buildSummarizeClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => any
): SummarizeClause {
  // 1. Find child nodes
  const list = node.children.find((c) => c.type === "aggregation_list");

  // 2. Build children recursively
  const aggregations = [];
  for (let i = 0; i < list.childCount; i++) {
    const child = list.child(i);
    if (child && child.type === "aggregation_expression") {
      aggregations.push(buildAggregationExpression(child, buildAST));
    }
  }

  // 3. Return typed node
  return { type: "summarize_clause", aggregations };
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
  |
bun run compile-grammar -> grammar.js
  |
bun x tree-sitter-cli generate -> parser (C code)
  |
bun run build:binding -> prebuilds/<platform>-<arch>/tree-sitter-kql.node (Native Binding)
  |
bun run build -> TypeScript compilation
  |
bun run test-grammar -> validate
```

## Cross-Platform Prebuilds

The `kql-parser` relies on native C++ bindings (`tree-sitter-kql.node`). For distribution, we prebuild these bindings for common platforms.

**Supported Targets:**

- `linux-x64`
- `linux-arm64`
- `win32-x64`
- `darwin-arm64`

**Note:** `darwin-x64` (Intel Mac) is explicitly excluded from the default support list to encourage ARM64 usage, though it can be built locally.

**Generating Prebuilds:**
We use GitHub Actions to generate these artifacts:

1. Push changes to `main`.
2. The `.github/workflows/build-bindings.yml` workflow runs.
3. Download artifacts from the workflow run and commit them to `packages/kql-parser/prebuilds/` if manual distribution is required (usually automated via release process).

**Local Build:**
Running `bun run build` will always build the binding for your _current_ platform and place it in the correct `prebuilds/` subdirectory.

## Key Patterns

**Wrapper Nodes (Tree-sitter 0.25+):**
Newer versions of tree-sitter may introduce wrapper nodes like `operator`, `expression`, or `literal` around the actual content.

```typescript
// src/builders/index.ts
case 'operator':
case 'expression':
case 'literal':
  return buildAST(node.firstNamedChild!);
```

**Lists with separators:**

```typescript
for (let i = 0; i < list.childCount; i++) {
  const child = list.child(i);
  if (child && child.type !== ",") {
    // Skip separators
    items.push(buildAST(child));
  }
}
```

**Optional parts:**

```typescript
const byIndex = node.children.findIndex((c) => c.text === "by");
if (byIndex !== -1) {
  const expr = node.children[byIndex + 1];
  if (expr) optional = buildAST(expr);
}
```

**Assignment detection:**

```typescript
const hasAssignment = node.children.some((c) => c.text === "=");
if (hasAssignment) {
  name = node.child(0);
  value = node.child(2); // index 1 is '='
}
```

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
    $.new_operator_clause
  );
```

### 4. Create Builders (`src/builders/operators.ts`)

```typescript
export function buildNewOperatorClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => any
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

- Mark checklist item [x] in the status section of `kql-parser-status.md`
- Add completion note with test count
- Document any gotchas discovered
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

## Dependencies

- **tree-sitter** - Parser generator & runtime (^0.25.0)
- **tree-sitter-cli** - Dev tool (testing)
- **TypeScript** - Type safety
- **Bun** - Runtime & package manager
