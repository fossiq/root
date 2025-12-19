# KQL Lezer Implementation Progress Log

## Session Summary

Working on completing Phase 0 of the KQL Lezer parser implementation based on the checklist in `docs/features-checklist.md`.

## Current Status

### ✅ Completed

1. **Directory Structure Created**
   - `src/grammar/plugins/tokens/` - Token definitions split by category
   - `src/grammar/plugins/rules/` - Rule definitions split by category
   - `src/parser/cst-to-ast/` - CST-to-AST conversion infrastructure
   - `src/kql-spec/` - Feature inventory

2. **Plugin Architecture**
   - Created `src/grammar/plugins/core.ts` - Core grammar definition
   - Created `src/grammar/index.ts` - Plugin merger (currently just exports core)
   - Split tokens into:
     - `delimiters.ts` - Pipe, parens, brackets, etc.
     - `operators.ts` - Math and comparison operators
     - `literals.ts` - Identifiers, numbers, strings, datetime, timespan, GUID
     - `keywords.ts` - Multi-word operators (project-away, mv-expand, etc.)
     - `whitespace.ts` - Comments and whitespace
   - Split rules into:
     - `query.ts` - Top-level Query rule
     - `let-statement.ts` - Let statement binding
     - `pipeline.ts` - Pipeline and table expressions
     - `where-clause.ts` - Where filtering operator
     - `expressions.ts` - Scalar expressions (arithmetic)

3. **CST-to-AST Infrastructure**
   - Created `src/parser/cst-to-ast/context.ts` - Central conversion context
   - Created `src/parser/cst-to-ast/operators/where.ts` - Where operator mapper
   - Created `src/parser/cst-to-ast/index.ts` - Main converter
   - Integrated into `src/index.ts` parseKQL function

4. **Feature Inventory**
   - Expanded `src/kql-spec/features.ts` with detailed examples
   - Added 7 feature entries covering all Phase 0 functionality
   - Each feature has positive and negative examples with doc URLs

5. **Code Cleanup**
   - Removed all "phase0", "Phase 0", "phase-0" terminology from code
   - Renamed `phase0-core.ts` to `core.ts`
   - Updated all references in features.ts to use "core" plugin name

6. **Grammar Generator Improvements**
   - Added RegExp object support to `@fossiq/lezer-grammar-generator`
   - Updated `src/model.ts` to accept `pattern: string | RegExp`
   - Updated `src/helpers.ts` regex() helper
   - Modified `src/serialize.ts` to extract `.source` from RegExp objects
   - Created `convertRegexToLezer()` function to convert regex patterns to Lezer syntax

### 🚧 In Progress

**Grammar Generation Issue**

The grammar generator's regex-to-Lezer converter needs refinement. Current issue:

**Problem**: Negated character classes are being double-wrapped
- Input regex: `/[^)]/` (match anything except closing paren)
- Current output: `!$[)]` (incorrect - `$[]` wrapped after `!`)
- Expected output: `![)]` (correct Lezer syntax)

**Root Cause**: The converter applies transformations in this order:
1. `[^...] -> ![...]` (negation)
2. `[...] -> $[...]` (wrapping)

This causes already-negated classes to get wrapped again.

**Location**: `packages/lezer-grammar-generator/src/serialize.ts:32-44`

**Current Code**:
```typescript
// Replace \d with @digit before processing character classes
result = result.replace(/\\d/g, "@digit");

// Replace common character classes with Lezer equivalents
result = result.replace(/\[0-9\]/g, "@digit");
result = result.replace(/\[a-zA-Z\]/g, "@asciiLetter");

// Handle negated character classes: [^...] -> ![...]
result = result.replace(/\[\^([^\]]+)\]/g, "![$1]");

// Wrap remaining character classes in $[...]
result = result.replace(/\[([^\]]+)\]/g, "$[$1]");
```

**Needed Fix**: The final replacement `\[([^\]]+)\]` matches `[)]` inside `!$[)]`, causing double-wrapping. Need to:
- Either: Only wrap `[...]` if not preceded by `!`
- Or: Mark already-processed patterns to skip them
- Or: Process in single pass with lookahead/lookbehind

### ❌ Blocked

- Cannot build grammar until regex converter is fixed
- Cannot run tests until build succeeds

## Technical Context

### Lezer Grammar Syntax (from official docs)

**Character Classes**:
- `$[a-zA-Z]` - Character set
- `![x]` - Inverted set (match anything except)
- `@digit` - Built-in for `[0-9]`
- `@asciiLetter` - Built-in for `[a-zA-Z]`

**Escaping**:
- Literal parens: `"("` and `")"` (quoted)
- No need for backslash escapes in Lezer

**Grouping**:
- No non-capturing groups - just use `(...)`
- Regex `/(?:foo|bar)/` becomes `(foo | bar)`

### Conversion Rules

| Regex | Lezer |
|-------|-------|
| `[0-9]` | `@digit` |
| `[a-zA-Z]` | `@asciiLetter` |
| `[abc]` | `$[abc]` |
| `[^abc]` | `![abc]` |
| `\(` | `"("` |
| `(?:...)` | `(...)` |
| `/\/\//` | `"//"` |

## Build Commands

```bash
# Build grammar generator
cd packages/lezer-grammar-generator && bun run build

# Generate KQL grammar
cd packages/kql-lezer && bun run scripts/generate-kql-grammar.ts

# Build KQL Lezer (generates parser from grammar)
cd packages/kql-lezer && bun run build

# Run tests
cd packages/kql-lezer && bun test
```

## Debug Steps Tried

1. ✅ Searched Lezer documentation for regex syntax
2. ✅ Added RegExp object support to avoid string escaping issues
3. ✅ Created regex-to-Lezer converter
4. ✅ Fixed escaped parentheses: `\(` -> `"("`
5. ✅ Fixed non-capturing groups: `(?:...)` -> `(...)`
6. ✅ Added character class wrapping: `[...]` -> `$[...]`
7. ❌ Still failing: Negated classes getting double-wrapped

## Next Steps

1. **Fix regex converter** - Prevent double-wrapping of negated character classes
   - Option A: Use negative lookbehind: `/(?<!!)\ [([^\]]+)\]/g`
   - Option B: Two-pass: Mark negated classes, then wrap unmarked
   - Option C: Single regex that handles both cases

2. **Test build** - Once converter is fixed, run full build

3. **Run test suite** - Verify all 108 tests still pass

4. **Complete Phase 0 checklist items**:
   - [x] Implement tokens, Query, TabularOperator (where), scalar expressions
   - [x] Convert TS grammar to .grammar via generator
   - [x] Implement CST-to-AST converter using real Lezer API
   - [x] Add tests for queries and AST validation
   - [ ] Performance: Parse 50 queries in <50ms average (needs benchmark)

## Files Modified This Session

### Grammar Generator (`packages/lezer-grammar-generator/`)
- `src/model.ts` - Added RegExp support to PatternExpression type
- `src/helpers.ts` - Updated regex() to accept RegExp objects
- `src/serialize.ts` - Added convertRegexToLezer() function

### KQL Lezer (`packages/kql-lezer/`)
- `src/grammar/plugins/core.ts` - Created (replaces phase0-core.ts)
- `src/grammar/plugins/tokens/*.ts` - Created 5 token files
- `src/grammar/plugins/rules/*.ts` - Created 5 rule files
- `src/parser/cst-to-ast/context.ts` - Created
- `src/parser/cst-to-ast/operators/where.ts` - Created
- `src/parser/cst-to-ast/index.ts` - Created
- `src/grammar/index.ts` - Updated to use core.ts
- `src/index.ts` - Integrated CST-to-AST conversion
- `src/kql-spec/features.ts` - Expanded with detailed examples
- `scripts/generate-kql-grammar.ts` - Updated imports

### Documentation
- `AGENTS.md` - Added rules about:
  - Never assume library/spec behavior - always search docs first
  - Keep files small (<100-150 lines)
  - Remove planning terminology from code
  - Use WebSearch/context7 before making assumptions

## Known Issues

1. **Regex Converter Double-Wrapping** (Priority: High)
   - See "In Progress" section above

2. **String Literal Escaping** (Priority: Medium)
   - Complex escape sequences may not convert correctly
   - May need manual patterns for some cases

3. **Performance Benchmark** (Priority: Low)
   - Need to create benchmark suite
   - Target: <50ms per query for 50 test queries

## Resources

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/)
- [Lezer Reference Manual](https://lezer.codemirror.net/docs/ref/)
- [JavaScript Grammar Example](https://github.com/lezer-parser/javascript/blob/main/src/javascript.grammar)
- [KQL Documentation](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)

## Testing Status

- **Total Tests**: 108
- **Passing**: 108 (before changes)
- **Failing**: N/A (cannot run build)
- **New Tests**: 0 (CST-to-AST tests pending)
