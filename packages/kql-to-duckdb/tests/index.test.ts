import { describe, test, expect } from 'bun:test';
import { parseKql } from '../src/index';

describe('KQL Parser Integration', () => {
  test('should parse a simple query', () => {
    const kql = 'Table | where Col > 10';
    const result = parseKql(kql);
    expect(result).toBeDefined();
    expect(result.type).toBe('source_file');
  });
});
