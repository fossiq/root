# @fossiq/lezer-grammar-generator Agent Notes

## Package Overview

This package is a pure TypeScript library that converts plain JavaScript/TypeScript grammar objects into Lezer `.grammar` text. It provides strong type-safe helpers and tooling for defining Lezer grammars programmatically. The library focuses on:

- **Type-safe grammar definitions** using TypeScript interfaces
- **Deterministic serialization** to Lezer grammar format
- **Comprehensive validation** of grammar structure and references
- **Helper functions** for constructing pattern expressions

The package does NOT include:
- CLI tools
- File I/O operations
- Parser generation (only grammar generation)

## Key Files and Their Purposes

### Core Implementation
- `src/model.ts`: Contains the `GrammarDefinition` and `PatternExpression` type definitions. This is the central type system for grammar definitions.
- `src/serialize.ts`: Implements `generateLezerGrammar` function for deterministic serialization of grammar objects to Lezer `.grammar` text.
- `src/validate.ts`: Contains `validateGrammar` function that performs shape validation and reference checking, returning structured issues (errors vs warnings).
- `src/generator.ts`: Legacy AST-based generator and plugin merging logic. This is maintained for backward compatibility.
- `src/helpers.ts`: PatternExpression helper constructors for creating grammar patterns in a type-safe manner.
- `src/legacy-helpers.ts`: Legacy string helpers exported under the `legacy` namespace. Use these only when working with older code.

### Tests
- `tests/`: Contains Bun test files. All new features must have corresponding tests.

### Configuration Files
- `package.json`: Defines dependencies, scripts, and package metadata.
- `tsconfig.json`: TypeScript configuration for the package.
- `bunfig.toml`: Bun runtime configuration.

## Development Commands

### Building
- `bun run build`: Builds the package using TypeScript compiler.

### Testing
- `bun test tests`: Runs all tests using Bun's test runner.
- `bun test tests/<specific-file>`: Runs tests in a specific file.

### Code Quality
- The project uses TypeScript strict mode. Ensure all code compiles without errors.
- Follow the existing code style (2-space indentation, Unix newlines).

## Architecture and Design Patterns

### Deterministic Output
The serialization function (`generateLezerGrammar`) produces deterministic output by ordering:
1. Tokens
2. Precedence rules
3. Top rules
4. Grammar rules

This ensures consistent generation regardless of object key order.

### Pure Functions
All helper functions are pure and stateless. Avoid introducing stateful builders or mutable shared state.

### Validation System
The validation function returns a structured result with:
- `errors`: Critical issues that prevent grammar generation
- `warnings`: Non-critical issues that might indicate problems
- `valid`: Boolean indicating if the grammar is valid

### Type Safety
The type system in `model.ts` is designed to catch common mistakes at compile time. When adding new features, ensure type definitions remain accurate and comprehensive.

## Adding New Features

### 1. Understanding Lezer Grammar Features
Before implementing, review the [Lezer documentation](https://lezer.codemirror.net/docs/guide/#writing-a-grammar) to understand the grammar feature you're adding support for.

### 2. Update Type Definitions
- Add new properties to `GrammarDefinition` or related interfaces in `src/model.ts`
- Ensure backward compatibility when possible

### 3. Update Serialization
- Modify `src/serialize.ts` to handle the new feature in `generateLezerGrammar`
- Maintain deterministic output ordering

### 4. Update Validation
- Add validation rules for the new feature in `src/validate.ts`
- Provide clear error/warning messages

### 5. Update Helpers (if needed)
- Add new helper functions to `src/helpers.ts` if the feature requires pattern expression construction

### 6. Write Tests
- Create comprehensive tests in `tests/` directory
- Test both valid and invalid cases
- Ensure edge cases are covered

### 7. Update Documentation
- Update this AGENTS.md file if the change affects development workflow
- Update README.md if the change affects public API
- Add JSDoc comments for new public APIs

## Implementation Insights from Recent Features

### @skip Blocks
- **Model**: Added `skip?: PatternExpression` to `GrammarDefinition` and `RuleDef`.
- **Serialization**: Global skip as `@skip { pattern }`; per-rule as `@skip { pattern } {\n  rule\n}`.
- **Validation**: Check references in skip patterns against symbol table.
- **Tests**: Cover global/per-rule serialization and invalid references.

### @detectDelim
- **Model**: Added `detectDelim?: boolean` to `GrammarDefinition`.
- **Serialization**: Output `@detectDelim` if true, placed after precedence.
- **Validation**: None required (Lezer handles detection).
- **Tests**: Simple directive presence check.

### @dialects
- **Model**: Added `dialects?: readonly string[]` to `GrammarDefinition`; `dialect?: string` to `TokenDef` and `RuleDef`.
- **Serialization**: `@dialects { sorted list }`; tokens as `name[@dialect=value] { pattern }`; rules with `[@dialect=value]` (unquoted, special handling in `formatProps`).
- **Validation**: Ensure dialects referenced in tokens/rules are declared.
- **Tests**: Directive, token/rule props, unknown dialect errors.

### General Patterns
- **Serialization Order**: Tokens → Externals → Dialects → Precedence → DetectDelim → Skip → Top → Rules.
- **Props Handling**: Use `formatProps` for consistency; special-case pseudo-props like `@dialect` to avoid unwanted quoting.
- **Regex Conversion**: `convertRegexToLezer` handles common patterns (e.g., `[0-9]` → `@digit`); test with RegExp.source.
- **Validation**: Traverse expressions with `walkExpressions`; check against symbol table (rules + tokens + externals).
- **Testing**: Isolate features; expect exact substrings; run full suite for regressions.


### Common Issues
- **Type errors**: Check `model.ts` for correct type definitions; ensure new props are optional for backward compatibility.
- **Serialization issues**: Verify `serialize.ts` handles all cases (e.g., ordering, special props); test output manually if needed.
- **Validation failures**: Check `validate.ts` for traversal logic; ensure symbol table includes all references.
- **Regex serialization**: Use RegExp objects in tests; `convertRegexToLezer` may alter patterns—verify output.
- **Props quoting**: Pseudo-props (e.g., `@dialect`) should not be quoted; handle in `formatProps` or `formatPropValue`.

### Testing Strategy
- Write tests that isolate specific functionality
- Use descriptive test names that indicate what's being tested
- Run tests frequently during development

## Integration with Other Packages

This package is used by:
- `@fossiq/kql-lezer`: For generating Lezer grammar for KQL (Kibana Query Language)
- Other packages that need programmatic Lezer grammar generation

When making changes, consider:
- Backward compatibility with existing consumers
- Versioning using changesets (see monorepo management in root AGENTS.md)

## Monorepo Considerations

This package is part of a monorepo. Key points:
- Dependencies between packages are managed via workspace protocol (`workspace:*`)
- Versioning uses [Changesets](https://github.com/changesets/changesets)
- CI/CD workflows are defined in `.github/workflows/`

See root `AGENTS.md` for detailed monorepo management guidelines.

## Verification of Lezer Grammar Feature Support

To verify if all Lezer grammar features are supported:

1. **Review Lezer Documentation**: Compare against the official Lezer grammar specification
2. **Check Type Definitions**: Ensure `model.ts` includes all possible grammar properties
3. **Test Serialization**: Verify each feature serializes correctly to `.grammar` format
4. **Validate Edge Cases**: Test complex grammar combinations

Current status (as of last update):
- ✅ Basic rules, tokens, precedence
- ✅ Pattern expressions (regex, string, seq, choice, etc.)
- ✅ Rule properties (skip, contextual, etc.)
- ✅ External tokens
- ✅ `@skip` blocks
- ✅ `@detectDelim`
- ✅ `@dialects`
- ⚠️ Some advanced features may need implementation

## Quick Reference

### Common Tasks
- **Add a new grammar property**: Update `model.ts`, `serialize.ts`, `validate.ts`, add tests
- **Fix a bug**: Write a failing test first, then fix, then ensure all tests pass
- **Improve performance**: Profile serialization, avoid unnecessary loops

### Code Style
- 2-space indentation in blocks
- Unix newlines (LF)
- TypeScript strict mode enabled
- Pure functions preferred

### Testing
- Use Bun test runner
- Tests should be fast and isolated
- Mock external dependencies when necessary

## TODO: Missing Lezer Grammar Features

The following Lezer grammar features are not yet supported. Agents should work on these tasks and remove them from this list once implemented:

1. **`@local tokens`**: Local token groups for context-specific tokenization (e.g., within string parsing)
2. **`@extend` operator**: Token extension (allowing both base and specialized tokens to be valid)
3. **Token properties**: Support for adding properties to tokens (e.g., `#[@name=value]`)
4. **Precedence markers**: Support for `!name` markers in pattern expressions to resolve conflicts
5. **`@cut` precedence**: Support for `@cut` in precedence declarations for forced precedence
6. **External specializers**: Support for `@external specialize` declarations
7. **External props**: Support for `@external prop` declarations
8. **Built-in character sets**: Full support for all Lezer built-in character sets (`@whitespace`, `@space`, `@newline`, etc.)

**Instructions for Agents**:
- When implementing a feature, remove it from this TODO list.
- Follow the "Adding New Features" guidelines above.
- Ensure each feature is thoroughly tested.

## Additional Resources

- [Lezer Documentation](https://lezer.codemirror.net/docs/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)

---
*This file should be updated whenever significant changes are made to the package architecture or development workflow.*
