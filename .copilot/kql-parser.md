# KQL Parser Instructions

## Thread Summary

This parser implementation uses tree-sitter for KQL grammar parsing and TypeScript for type-safe AST generation. The codebase has been structured with:

**Architecture:**

- Grammar defined in TypeScript (`src/grammar/rules.ts`) compiled to `grammar.js`/`grammar.cjs`
- AST builders split by domain: `literals.ts`, `expressions.ts`, `operators.ts`, `statements.ts`
- Functional programming approach (no classes, pure functions)
- Type-safe node definitions with discriminated unions

**Current State:**

- Core operators implemented: where, project, extend, take/limit, sort, distinct, count, top, search
- Expressions: binary, comparison, arithmetic, string, in, between, parenthesized
- Literals: string, number, boolean, null
- Grammar successfully compiles with tree-sitter CLI

# KQL Parser Instructions

## Grammar Development

- Keep grammar rules minimal and focused
- Use tree-sitter conventions for rule naming
- Prefer explicit rules over implicit ones
- Test grammar changes incrementally
- Always edit the source TS files at `src/grammar/` and then compile using `bun run compile-grammar`. Do not edit any `js` or `cjs` files directly.

## AST Design

- Keep AST nodes simple and flat when possible
- Each node type should have a clear purpose
- Avoid deep nesting in type definitions
- Use discriminated unions for node types

## Parser Implementation

- Separate concerns: grammar, types, AST builder, parser wrapper
- Use pure functions over classes for stateless transformations
- Keep builder functions small and focused (one per node type)
- Handle errors gracefully with descriptive messages
- Don't add features until explicitly requested
- Export both individual functions and composed utilities

## Grammar Development with TypeScript

- Grammar is now written in TypeScript for type safety
- Source files are in `src/grammar/` directory:
  - `types.ts` - Tree-sitter grammar type definitions and helper functions
  - `rules.ts` - Actual KQL grammar rules with full type checking
  - `compile.ts` - Compiler script that generates `grammar/grammar.js`
- Run `bun run compile-grammar` to compile TS grammar to JS
- Grammar is automatically compiled before build via `prebuild` script
- Always edit `src/grammar/rules.ts`, never edit `grammar/grammar.js` directly

## File Organization

- Split large files into smaller, focused modules
- Group related functions by domain or feature (not by type)
- Use folders to organize related modules (e.g., `builders/`)
- Each file should have a single, clear responsibility
- Keep individual files under ~100-150 lines when possible
- Use index files to re-export from folders
- Examples of good groupings:
  - `builders/literals.ts` - identifier, string, number, boolean builders
  - `builders/expressions.ts` - binary, comparison expression builders
  - `builders/operators.ts` - where, project, extend clause builders
  - `builders/statements.ts` - source file, query, pipe builders

## KQL Specifics

- KQL uses pipe operator `|` to chain operations
- Table names come first in queries
- Operators follow pipes (where, project, summarize, etc)
- Keep expressions simple initially, expand as needed

## Development Workflow

- Edit grammar in `src/grammar/rules.ts` with TypeScript
- Run `bun run compile-grammar` to generate `grammar/grammar.js`
- Grammar is auto-compiled on build via prebuild hook
- Test with simple queries first
- Build incrementally - don't implement all KQL at once
- Focus on correctness over completeness

## Code Style

- Prefer pure functions over classes for transformations
- Use functional composition where appropriate
- Keep functions stateless unless absolutely necessary
- Export granular functions for testing and reuse

## KQL Feature Implementation Checklist

### Core Query Structure

- [x] Pipe operator (`|`)
- [x] Table references
- [x] Basic where clause

### Operators

- [x] `project` - Select specific columns
- [x] `extend` - Add computed columns
- [ ] `summarize` - Aggregation operations
- [x] `sort` / `order by` - Sort results
- [x] `take` / `limit` - Limit result count
- [x] `top` - Top N results
- [ ] `join` - Join tables
- [ ] `union` - Combine tables
- [x] `distinct` - Unique values
- [x] `count` - Count rows
- [x] `search` - Full-text search

### Expressions

- [x] Binary operators (and, or)
- [x] Comparison operators (==, !=, >, <, >=, <=)
- [x] Arithmetic operators (+, -, \*, /, %)
- [x] String operators (contains, startswith, endswith, matches regex)
- [x] in operator
- [x] between operator
- [x] Parenthesized expressions

### Literals & Values

- [x] String literals
- [x] Number literals
- [x] Boolean literals
- [x] Null literal
- [ ] DateTime literals
- [ ] TimeSpan literals
- [ ] Dynamic/JSON literals
- [ ] Array literals

### Functions

- [ ] Scalar functions (strlen, toupper, tolower, etc)
- [ ] Aggregation functions (sum, avg, min, max, count, etc)
- [ ] DateTime functions (now, ago, startofday, etc)
- [ ] String functions (split, substring, replace, etc)
- [ ] Math functions (abs, sqrt, pow, etc)
- [ ] Conditional functions (iff, case)

### Advanced Features

- [ ] let statements (variables)
- [ ] Column references with table prefix
- [ ] Nested queries / subqueries
- [ ] mv-expand (multi-value expand)
- [ ] parse operator
- [ ] Comments (single-line and multi-line)
- [ ] String interpolation
- [ ] Function calls with named arguments

### Data Types

- [ ] Type casting (to string, to int, to datetime, etc)
- [ ] Dynamic type handling
- [ ] Array/list operations
