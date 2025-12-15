# @fossiq/kql-lezer Development Guide

Lezer-based KQL parser for CodeMirror with real-time syntax highlighting. Optimized for editor performance with incremental parsing.

## Purpose

- **CodeMirror Integration**: First-class syntax highlighting support
- **Incremental Parsing**: Lezer's incremental parser only re-parses changed regions
- **No WASM**: Pure JavaScript, no runtime dependencies beyond Lezer
- **AST Compatible**: Outputs compatible with @fossiq/kql-ast types
- **Lightweight**: Minimal bundle impact for UI

## Architecture

### Grammar-Based Parser

Uses Lezer grammar DSL (`kql.grammar`) to define:

- KQL statement structure
- Operator precedence
- Token patterns
- Syntax highlighting tags

### Parsing Pipeline

1. **Lexing**: Tokenize input (keywords, identifiers, operators, etc.)
2. **Parsing**: Build parse tree respecting KQL grammar
3. **Highlighting**: Apply syntax highlighting rules via Lezer's tag system
4. **AST Conversion**: Convert to @fossiq/kql-ast format (optional)

## Package Structure

```
packages/kql-lezer/
├── src/
│   ├── kql.grammar      # Lezer grammar definition
│   ├── parser.ts        # Generated from grammar (auto-generated, @ts-nocheck)
│   ├── parser.terms.ts  # Generated from grammar (auto-generated)
│   └── index.ts         # Language support & AST conversion
├── scripts/
│   └── fix-parser-types.sh  # Adds @ts-nocheck header to generated parser
├── tests/               # Test suite (77 tests)
├── dist/                # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Key Files

### kql.grammar

Defines complete KQL syntax:

- **Top level**: `let` statements, tabular operations
- **Operators**: where, project, select, filter, summarize, sort, limit, distinct, count, union
- **Expressions**: Logical operators, comparisons, arithmetic, function calls
- **Tokens**: Keywords, identifiers, numbers, strings, comments
- **Precedence**: Operator precedence rules

### index.ts

Exports:

- `kqlLanguage`: Lezer language definition
- `kql()`: CodeMirror LanguageSupport
- `toParsedAST()`: Convert to @fossiq/kql-ast format
- `extractHighlightTokens()`: Get highlight tokens

## Build Process

```bash
# Generate parser from grammar
lezer-generator src/kql.grammar -o src/parser.ts

# Compile TypeScript
tsc
```

## Integration with CodeMirror

```typescript
import { kql } from "@fossiq/kql-lezer";
import { EditorView, basicSetup } from "codemirror";

const editor = new EditorView({
  extensions: [basicSetup, kql()],
  parent: document.body,
});
```

## Syntax Highlighting

Tags applied via `styleTags`:

- Keywords: `let`, `where`, `project`, `select`, etc.
- Types: Identifiers, table names, column names
- Operators: Comparison, logical, arithmetic
- Literals: Numbers, strings
- Comments: Line and block comments
- Punctuation: Parentheses, brackets, commas

## Implementation Status

### Phase 1: Grammar & Parser ✓

- [x] Define KQL grammar in Lezer format
- [x] Basic expression parsing
- [x] Operator precedence
- [x] Token definitions
- [x] Keyword highlighting setup

### Phase 2: Language Support

- [ ] Generate parser from grammar
- [ ] Integrate with CodeMirror
- [ ] Test in UI

### Phase 3: AST Conversion

- [ ] Implement toParsedAST()
- [ ] Implement extractHighlightTokens()
- [ ] Full compatibility with kql-ast types

### Phase 4: Testing

- [ ] Unit tests for grammar
- [ ] Integration tests with CodeMirror
- [ ] Performance benchmarks
- [ ] Example queries

## Design Decisions

1. **Lezer over Tree-sitter for UI**:

   - No WASM runtime needed
   - Incremental parsing out of the box
   - Direct CodeMirror integration
   - Lighter bundle

2. **Separate from kql-parser**:

   - kql-parser (tree-sitter) for backend/CLI
   - kql-lezer (Lezer) for editor syntax highlighting
   - Different use cases, different tools

3. **AST Conversion**:
   - Lezer's parse tree can convert to kql-ast
   - Allows interop with other tools
   - Optional conversion (not required for highlighting)

## Testing KQL Grammar

Common test cases:

- Simple table reference: `Events`
- Where clause: `Events | where EventTime > now(-1d)`
- Multiple operators: `Events | where EventTime > now(-1d) | project Name, EventTime | sort EventTime desc`
- Function calls: `Events | where contains(Name, "error")`
- Comments: `// comment` and `/* block comment */`
- Aggregations: `Events | summarize count() by EventType`

## Performance Considerations

- **Incremental Parsing**: Only changed lines re-parsed on edit
- **Streaming**: Process large queries efficiently
- **Memory**: Lightweight parse tree representation
- **Responsiveness**: Minimal latency for editor feedback

## Future Enhancements

- Code completion/auto-complete
- Error recovery improvements
- Semantic analysis (scoping, type checking)
- Code formatting
- Refactoring utilities
