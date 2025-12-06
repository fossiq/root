# Expedition

A web application for querying CSV files using KQL (Kusto Query Language) with an Azure Data Explorer-like interface.

## Features

- Load CSV files from your local disk using the File System Access API
- Query CSV data using KQL syntax with database name support
- CodeMirror editor with KQL syntax highlighting and placeholder hints
- Results-only display (no preview until query execution)
- Session storage for persisting loaded data across page reloads
- Azure Data Explorer-inspired UI layout

## Tech Stack

- **Frontend Framework**: SolidJS
- **State Management**: solid-js/store
- **Styling**: PicoCSS
- **Editor**: CodeMirror
- **Table Component**: @tanstack/solid-table
- **Build Tool**: Vite
- **Runtime**: Bun
- **Language**: TypeScript

## Setup

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun run dev
```

3. Build for production:

```bash
bun run build
```

4. Preview production build:

```bash
bun run preview
```

## Usage

1. Click "Load CSV" to select and load a CSV file from your local disk
2. The CSV filename (without extension) becomes your database/table name
3. Write your KQL query in the editor using the database name
4. Click "Run Query" to execute the query
5. View the results in the results table below

### Query Example

If you load a file named `employees.csv`, you can query it like:

```kql
employees
| where Age > 25
| project Name, Age, Department
| take 10
```

## Supported KQL Operators

- `where` - Filter rows based on conditions
- `project` - Select specific columns
- `take` / `limit` - Limit the number of rows
- `sort by` / `order by` - Sort results
- `count` - Count rows
- `summarize` - Aggregate data
- `distinct` - Get unique values

## Example Queries

```kql
tablename
| where Age > 25
| project Name, Age, City
| sort by Age desc
| take 10
```

```kql
tablename
| where City contains "New York"
| summarize count() by Department
```

## License

MIT
