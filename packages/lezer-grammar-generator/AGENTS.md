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

## Debugging Tips

### Common Issues
- **Type errors**: Check `model.ts` for correct type definitions
- **Serialization issues**: Verify `serialize.ts` handles all cases of the new feature
- **Validation failures**: Check `validate.ts` for correct validation logic

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

1. **`@detectDelim`**: Automatic detection of delimiter tokens and generation of `openedBy`/`closedBy` props
2. **`@dialects`**: Support for conditional grammar dialects (e.g., `@dialects { comments }` and `Comment[@dialect=comments]`)
3. **`@local tokens`**: Local token groups for context-specific tokenization (e.g., within string parsing)
4. **`@extend` operator**: Token extension (allowing both base and specialized tokens to be valid)
5. **Token properties**: Support for adding properties to tokens (e.g., `#[@name=value]`)
6. **Precedence markers**: Support for `!name` markers in pattern expressions to resolve conflicts
7. **`@cut` precedence**: Support for `@cut` in precedence declarations for forced precedence
8. **External specializers**: Support for `@external specialize` declarations
9. **External props**: Support for `@external prop` declarations
10. **Built-in character sets**: Full support for all Lezer built-in character sets (`@whitespace`, `@space`, `@newline`, etc.)

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
