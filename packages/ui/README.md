# @fossiq/ui

A modern, browser-based UI for querying data using Kusto Query Language (KQL), built with SolidJS and DuckDB WASM.

![Fossiq UI](https://github.com/user-attachments/assets/dd276e6f-77ad-4ce3-a2de-da9329fc23de)

## Features

- **Advanced KQL Editor**: Full-featured code editor powered by CodeMirror 6 with:
  - Syntax highlighting for KQL
  - Context-aware autocomplete
  - Real-time syntax error visualization
  - Semantic validation (e.g., checking if tables exist)
- **Local Execution**: Runs entirely in the browser using [DuckDB WASM](https://duckdb.org/docs/api/wasm/overview.html). No backend required.
- **KQL to SQL**: Seamlessly translates KQL queries to DuckDB-compatible SQL on the fly using `@fossiq/kql-to-duckdb`.
- **Data Visualization**: Interactive results table for exploring query results.
- **Modern Stack**: Built with [SolidJS](https://www.solidjs.com/) for high performance and [PicoCSS](https://picocss.com/) for a clean, minimal design.

## Getting Started

To start the development server:

```bash
cd packages/ui
bun run dev
```

Visit `http://localhost:5173` (or the port shown in the console) to see the application.

## Architecture

The UI integrates several internal packages:

- **@fossiq/kql-parser**: Parses KQL queries into an AST.
- **@fossiq/kql-lezer**: Provides Lezer grammar for CodeMirror syntax highlighting and error detection.
- **@fossiq/kql-to-duckdb**: Translates KQL AST into SQL.

## License

MIT
