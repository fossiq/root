# Contributing to Fossiq

Thank you for your interest in contributing to Fossiq! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+) - Runtime and package manager
- Git

### Setup

```bash
git clone git@github.com:fossiq/root.git
cd root
bun install
```

## Development Workflow

### Building Packages

```bash
# Build all packages
bun run build

# Build specific package
cd packages/kql-parser && bun run build
```

### Running Tests

```bash
# Run tests for a package
cd packages/kql-parser && bun run test

# Run tests in watch mode
bun run test:watch
```

### Linting

```bash
# Lint all packages
bun run lint

# Auto-fix issues
bun run lint:fix
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feat/add-new-operator` - New features
- `fix/parser-edge-case` - Bug fixes
- `docs/update-readme` - Documentation changes

### Commit Messages

Write clear, concise commit messages:
- `feat: Add support for mv-expand operator`
- `fix: Handle edge case in datetime parsing`
- `docs: Update installation instructions`

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Run tests and linting before pushing
4. Open a PR with a clear description
5. Wait for review and CI checks

## Versioning & Releases

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

### Creating a Changeset

After making changes to a package:

```bash
bun run changeset
```

1. Select the package(s) you changed
2. Choose version bump type:
   - `patch` - Bug fixes (0.1.0 -> 0.1.1)
   - `minor` - New features (0.1.0 -> 0.2.0)
   - `major` - Breaking changes (0.1.0 -> 1.0.0)
3. Write a brief description (appears in CHANGELOG)
4. Commit the generated `.changeset/*.md` file with your changes

### Release Process

1. Push changes with changesets to `main`
2. GitHub Actions creates a "Release: Version Packages" PR
3. Merge the PR to publish packages to npm automatically

## Code Style

- **Language**: TypeScript with ESM modules
- **Runtime**: Bun (use `bunx` instead of `npx`, `bun run` instead of `npm run`)
- **Style**: Functional programming over classes
- **Functions**: Small, focused, single responsibility
- **Testing**: Tests in `tests/` directories, not in `src/`

## Package Guidelines

### Adding a New Package

1. Create directory: `packages/<package-name>/`
2. Use `@fossiq/` prefix for package names
3. Follow existing package structure (see `kql-parser` as reference)
4. Add to workspace in root `package.json`

### Dependencies

- Use `workspace:*` for internal package dependencies
- Keep external dependencies minimal
- Pin dev dependency versions

## Need Help?

- Check existing issues on GitHub
- Review the documentation in `.github/instructions/`
- Open an issue for questions or bugs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
