import { describe, test, expect, beforeAll } from 'bun:test';
import { parseKql, initParser } from '../src/index';
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
});
