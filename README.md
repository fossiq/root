# Fossiq

[![CI](https://github.com/fossiq/root/actions/workflows/ci.yml/badge.svg)](https://github.com/fossiq/root/actions/workflows/ci.yml)

A monorepo containing KQL (Kusto Query Language) tooling and applications. Query your CSV files using KQL syntax with an Azure Data Explorer-like interface.

## Packages

| Package                                           | Description                                           | Status                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [@fossiq/kql-parser](./packages/kql-parser)       | Tree-sitter based KQL parser with typed AST           | [![npm](https://img.shields.io/npm/v/@fossiq/kql-parser.svg)](https://www.npmjs.com/package/@fossiq/kql-parser)       |
| [@fossiq/kql-to-duckdb](./packages/kql-to-duckdb) | KQL to DuckDB SQL translator                          | [![npm](https://img.shields.io/npm/v/@fossiq/kql-to-duckdb.svg)](https://www.npmjs.com/package/@fossiq/kql-to-duckdb) |
| [@fossiq/kql-ast](./packages/kql-ast)             | Shared AST type definitions                           | [![npm](https://img.shields.io/npm/v/@fossiq/kql-ast.svg)](https://www.npmjs.com/package/@fossiq/kql-ast)             |
| [@fossiq/kql-lezer](./packages/kql-lezer)         | Lezer-based parser for CodeMirror syntax highlighting | [![npm](https://img.shields.io/npm/v/@fossiq/kql-lezer.svg)](https://www.npmjs.com/package/@fossiq/kql-lezer)         |
| [@fossiq/ui](./packages/ui)                       | Web application (private)                             | -                                                                                                                     |

### @fossiq/kql-parser

Tree-sitter based KQL parser providing:

- Complete KQL grammar (14 operators, all expression types)
- Type-safe AST generation
- 88 comprehensive tests
- Cross-platform native bindings

### @fossiq/kql-to-duckdb

Translates KQL queries to DuckDB SQL:

- 11 core operators (where, project, extend, summarize, sort, distinct, take/limit, top, union, mv-expand, search)
- All 8 KQL join types
- 35+ functions (string, math, datetime, type conversion)
- 113 integration tests

### @fossiq/kql-lezer

Lezer-based parser for editor integration:

- Real-time syntax highlighting
- CodeMirror 6 language support
- No WASM required (pure JavaScript)
- Incremental parsing

### @fossiq/ui

Web application for querying CSV files:

- Azure Data Explorer-like interface
- DuckDB WASM for in-browser SQL execution
- File persistence across page reloads
- Light/dark theme support

## Quick Start

```bash
# Install dependencies
bun install

# Start the web app
cd packages/ui && bun run dev
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) v1.0+

### Commands

```bash
bun install          # Install all dependencies
bun run build        # Build all packages
bun run lint         # Lint all packages
bun run lint:fix     # Auto-fix lint issues
bun run changeset    # Create a changeset for versioning
```

### Package Development

```bash
# Build specific package
cd packages/kql-parser && bun run build

# Run tests
cd packages/kql-parser && bun run test

# Watch mode
cd packages/kql-parser && bun run test:watch
```

## Repository Structure

```
.
├── packages/
│   ├── kql-parser/      # Tree-sitter KQL parser
│   ├── kql-to-duckdb/   # KQL to SQL translator
│   ├── kql-ast/         # Shared AST types
│   ├── kql-lezer/       # Lezer parser for editors
│   └── ui/              # Web application
├── .github/
│   ├── workflows/       # CI/CD workflows
│   ├── scripts/         # Build scripts
│   └── instructions/    # Development guides
└── .changeset/          # Version management
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Development workflow
- Code style
- Creating pull requests
- Versioning with Changesets

## For AI Agents

See [AGENTS.md](./AGENTS.md) for detailed instructions on working with this codebase.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (ESM)
- **Parsers**: Tree-sitter, Lezer
- **Frontend**: SolidJS, Vite, PicoCSS, CodeMirror 6
- **Database**: DuckDB WASM
- **CI/CD**: GitHub Actions
- **Versioning**: Changesets

## License

MIT
