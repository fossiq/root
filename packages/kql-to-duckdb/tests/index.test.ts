import { describe, test, expect, beforeAll } from 'bun:test';
import { parseKql, initParser, kqlToDuckDB } from '../src/index';
import { resolve } from 'path';

describe('KQL Parser Integration', () => {
  beforeAll(async () => {
    // Resolve path to the WASM file in the monorepo
    const wasmPath = resolve(import.meta.dir, '../../kql-parser/tree-sitter-kql.wasm');
    await initParser(wasmPath);
  });

  test('should parse a simple query', () => {
    const kql = 'Table | where Col > 10';
    const result = parseKql(kql);
    expect(result).toBeDefined();
    expect(result.type).toBe('source_file');
  });

  describe('Translation', () => {
    test('should translate simple table', () => {
      const kql = 'Table';
      const sql = kqlToDuckDB(kql);
      expect(sql).toBe('SELECT * FROM Table');
    });

    test('should translate where clause', () => {
      const kql = 'Table | where Col > 10';
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain('WITH cte_0 AS (SELECT * FROM Table WHERE Col > 10) SELECT * FROM cte_0');
    });

    test('should translate project clause', () => {
      const kql = 'Table | project Col1, Col2';
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain('WITH cte_0 AS (SELECT Col1, Col2 FROM Table) SELECT * FROM cte_0');
    });

    test('should translate take clause', () => {
      const kql = 'Table | take 5';
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain('WITH cte_0 AS (SELECT * FROM Table LIMIT 5) SELECT * FROM cte_0');
    });

    test('should translate pipeline', () => {
      const kql = 'Table | where Col > 10 | project Col';
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain('cte_0 AS (SELECT * FROM Table WHERE Col > 10)');
      expect(sql).toContain('cte_1 AS (SELECT Col FROM cte_0)');
      expect(sql).toContain('SELECT * FROM cte_1');
    });

    test('should translate summarize', () => {
      const kql = 'Table | summarize count() by Col';
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain('GROUP BY Col');
      expect(sql).toContain('COUNT(*)');
    });
  });
});
