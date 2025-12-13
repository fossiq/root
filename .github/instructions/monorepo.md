# Monorepo Management

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

When creating a new package, follow this incremental approach:

### Step 1: Planning

1. Create a development guide in `.github/instructions/<package-name>-dev.md`
2. Include: package structure, implementation phases, feature checklist
3. Get user approval before proceeding with implementation

### Step 2: Package Setup

Create files one at a time, getting approval between steps:

1. **Create directory:** `packages/<package-name>/`
2. **`package.json`:**
   ```json
   {
     "name": "@fossiq/<package-name>",
     "version": "0.1.0",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "test": "bun test tests"
     },
     "dependencies": {},
     "devDependencies": {
       "@types/bun": "^1.3.4",
       "@types/node": "^20.0.0",
       "typescript": "^5.0.0"
     }
   }
   ```
3. **`tsconfig.json`:** Copy from existing package (e.g., `kql-parser`)
4. **`src/types.ts`:** Define core types
5. **`src/index.ts`:** Public API with minimal stubs

### Step 3: Incremental Implementation

- Implement one feature at a time
- Get user approval before each major code generation
- Update the development guide checklist as features complete
- Add tests after each feature

### Key Principles

- Workspace dependencies: Use `"workspace:*"` for internal packages
- Automatic registration: `packages/*` glob auto-includes new packages
- Keep initial implementation minimal - avoid generating boilerplate
- Never auto-commit changes

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

## ESLint Setup

- **Root configuration:** `.eslintrc.json` at monorepo root defines shared rules
- **Package overrides:** Packages can extend root config with `.eslintrc.json`
- **Ignore patterns:** `.eslintignore` excludes build outputs and generated files
- **Commands:**
  - `bun run lint` - Lint all packages
  - `bun run lint:fix` - Auto-fix linting issues
- **Dependencies:** ESLint and TypeScript plugins installed at root level
- **Package-specific rules:**
  - `packages/kql-parser`: Restricts `bun:test` imports in `src/` folder
  - `packages/kql-to-duckdb`: Restricts `bun:test` imports in `src/` folder

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

### Single Version Strategy

The monorepo uses a **"Single Version for All"** strategy:

- All publishable packages (`packages/*` excluding `ui`) are synchronized to the same version.
- When _any_ package changes, _all_ packages receive a version bump.
- This simplifies dependency management and ensures compatibility across the monorepo.
- The `ci:publish` script (`.github/scripts/publish-packages.sh`) is configured to attempt publishing **all** packages, not just affected ones, ensuring consistency.

### Changesets

The monorepo uses [@changesets/cli](https://github.com/changesets/changesets) for version management and changelog generation.

**Making changes:**

1. After making changes to a package, create a changeset:

   ```bash
   bun run changeset
   ```

2. Select the packages that changed and the version bump type:

   - `patch` - Bug fixes (0.1.0 -> 0.1.1)
   - `minor` - New features (0.1.0 -> 0.2.0)
   - `major` - Breaking changes (0.1.0 -> 1.0.0)

3. Write a brief description of the change (appears in CHANGELOG)

4. Commit the changeset file (`.changeset/*.md`) with your changes

**Releasing:**

When changesets are merged to `main`:

- GitHub Actions detects changesets
- Creates/updates a "Release: Version Packages" PR that:
  - Bumps package versions (all packages synced)
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

- `.changeset/config.json` - Changesets configuration (configured for `fixed` mode)
- `access: "public"` - All packages are public on npm
- `baseBranch: "main"` - Base branch for version PRs

## GitHub Workflows

### CI Workflow (`ci.yml`)

The main CI workflow runs on every push to `main` that affects package code:

- **Build:** Compiles all packages using `build-packages.sh`
- **Test:** Runs tests with coverage using `test-packages.sh`
  - Uses `bun test --coverage` to generate coverage reports
  - Coverage reports are saved to `packages/*/coverage/`
- **Coverage:** Uploads coverage to Codecov
  - Requires `CODECOV_TOKEN` secret to be configured
  - Aggregates coverage from all packages
  - Non-blocking (won't fail CI if upload fails)
- **Publish:** Publishes packages to npm with provenance

### Best Practices

- **Prefer existing GitHub Actions** (e.g., `actions/cache`, `codecov/codecov-action`)
- **Write scripts in `.github/scripts/`** - never use inline shell code in workflow files
- Scripts should follow patterns in `build-packages.sh` and `test-packages.sh`
- Keep workflows simple and maintainable
