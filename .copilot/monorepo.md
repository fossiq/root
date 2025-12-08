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

## Code Quality

### ESLint Setup

- **Root configuration:** `.eslintrc.json` at monorepo root defines shared rules
- **Package overrides:** Packages can extend root config with `.eslintrc.json`
- **Ignore patterns:** `.eslintignore` excludes build outputs and generated files
- **Commands:**
  - `bun run lint` - Lint all packages
  - `bun run lint:fix` - Auto-fix linting issues
- **Dependencies:** ESLint and TypeScript plugins installed at root level
- **Package-specific rules:**
  - `packages/app`: JSX support for Solid.js
  - `packages/kql-parser`: Restricts `bun:test` imports in `src/` folder

### Adding ESLint to New Packages

1. Create `.eslintrc.json` if package needs custom rules:
   ```json
   {
     "extends": ["../../.eslintrc.json"],
     "rules": {
       // package-specific rules
     }
   }
   ```
2. No need to add ESLint dependencies - they're hoisted from root
3. Package can use root lint commands or define its own

## Versioning and Releases

### Changesets

The monorepo uses [@changesets/cli](https://github.com/changesets/changesets) for version management and changelog generation.

**Making changes:**

1. After making changes to a package, create a changeset:

   ```bash
   bun run changeset
   ```

2. Select the packages that changed and the version bump type:

   - `patch` - Bug fixes (0.1.0 → 0.1.1)
   - `minor` - New features (0.1.0 → 0.2.0)
   - `major` - Breaking changes (0.1.0 → 1.0.0)

3. Write a brief description of the change (appears in CHANGELOG)

4. Commit the changeset file (`.changeset/*.md`) with your changes

**Releasing:**

When changesets are merged to `main`:

- GitHub Actions detects changesets
- Creates/updates a "Release: Version Packages" PR that:
  - Bumps package versions
  - Updates CHANGELOGs
  - Removes consumed changesets
- Merge the release PR to publish to npm automatically
- GitHub release is created with changelog notes

**Manual release (if needed):**

```bash
bun run version  # Bump versions and update CHANGELOGs
bun run release  # Publish to npm
```

**Configuration:**

- `.changeset/config.json` - Changesets configuration
- `access: "public"` - All packages are public on npm
- `baseBranch: "main"` - Base branch for version PRs

## GitHub Workflows

- **Prefer existing GitHub Actions** (e.g., `actions/cache`)
- **Write scripts in `.github/scripts/`** - never use inline shell code in workflow files
- Scripts should follow patterns in `build-packages.sh` and `test-packages.sh`
