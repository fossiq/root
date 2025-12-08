# KQL to DuckDB Development Guide

## Package Structure

```
packages/kql-to-duckdb/
├── src/
│   ├── index.ts          # Public API
│   ├── translator.ts     # Core translation logic
│   └── types.ts          # Type definitions
├── tests/
│   └── basic.test.ts     # Basic tests
└── package.json
```

## Implementation Phases

### Phase 1: Setup & Parsing (Current)
- [ ] Create package structure
- [ ] Add dependency on `@fossiq/kql-parser`
- [ ] Implement basic parser invocation
- [ ] Verify with simple test

### Phase 2: Basic Translation
- [ ] Translate `source` (table name)
- [ ] Translate `project` operator
- [ ] Translate `where` operator
- [ ] Translate `take`/`limit` operator

### Phase 3: Aggregations
- [ ] Translate `summarize` operator
- [ ] Translate aggregation functions (`count`, `sum`, `avg`)

### Phase 4: Advanced Features
- [ ] Translate `extend`
- [ ] Translate `sort`
- [ ] Complex expressions

## Usage

```typescript
import { kqlToDuckDB } from '@fossiq/kql-to-duckdb';

const kql = "Table | where Col > 10";
const duckDbQuery = kqlToDuckDB(kql);
console.log(duckDbQuery);
```
