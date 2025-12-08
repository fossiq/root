# Fossiq Root

A monorepo containing KQL (Kusto Query Language) tooling and applications.

## Packages

### [@fossiq/kql-parser](./packages/kql-parser)

A TypeScript parser for Kusto Query Language (KQL) built with tree-sitter. Provides complete KQL grammar support with type-safe AST generation.

[![npm version](https://img.shields.io/npm/v/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser)

### [@fossiq/app](./packages/app) (Private)

A web application for querying CSV files using KQL with an Azure Data Explorer-like interface.

## Development

This is a Bun workspace monorepo. Install dependencies from the root:

```bash
bun install
```

### Working with Packages

Build all packages:

```bash
# Build kql-parser (app is skipped as it's private)
cd packages/kql-parser
bun run build
```

Run tests:

```bash
cd packages/kql-parser
bun run test
```

Start the app:

```bash
bun run dev
```

### Versioning and Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management.

**To release a new version:**

1. Make your changes to a package
2. Create a changeset:
   ```bash
   bun run changeset
   ```
3. Select the package(s) that changed and the version bump type (patch/minor/major)
4. Commit the changeset with your changes
5. Push to main - GitHub Actions will create a "Release: Version Packages" PR
6. Review and merge the PR - packages will be automatically published to npm

See [`.copilot/monorepo.md`](./.copilot/monorepo.md) for detailed versioning documentation.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Parser**: tree-sitter
- **Frontend** (app): SolidJS, Vite, PicoCSS
- **CI/CD**: GitHub Actions
- **Package Manager**: Changesets

## Repository Structure

```
.
├── packages/
│   ├── kql-parser/          # KQL parser library (published to npm)
│   └── app/                 # CSV query web app (private)
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── .changeset/              # Changesets configuration
└── .copilot/                # Development documentation
```

## License

MIT
