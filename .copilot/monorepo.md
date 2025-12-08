# Monorepo Management Instructions

## Package Structure

- Each package in `packages/` should be independent and focused
- Packages can depend on other packages using workspace protocol
- Keep package boundaries clean and well-defined
- Avoid circular dependencies between packages

## Package Naming

- Use `@fossiq/` prefix for all packages
- Use kebab-case for package names
- Names should reflect the package's purpose clearly

## Dependencies

- Use workspace dependencies for internal packages
- Keep external dependencies minimal
- Use peer dependencies for shared runtime dependencies
- Pin versions for dev dependencies

## Build Process

- Each package should have its own build configuration
- Use TypeScript for type checking and compilation
- Keep build scripts simple and focused
- Avoid complex build pipelines initially

## Adding New Packages

- Create package directory in `packages/`
- Add `package.json` with proper name and version
- Include `tsconfig.json` for TypeScript projects
- Add to workspace configuration automatically via `packages/*` glob
- Keep initial implementation minimal

## Package Exports

- Use ESM module format
- Export types alongside implementation
- Keep public API surface small
- Use `index.ts` as main entry point

## Testing

- Tests should be colocated with source when appropriate
- Use Bun test runner for consistency
- Each package can be tested independently
- Avoid test infrastructure complexity

## Versioning

- Start new packages at version 0.1.0
- Bump versions together when packages are interdependent
- Use semantic versioning principles
