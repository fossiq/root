import { describe, test, expect } from 'bun:test';
import { parseWithTreeSitter } from './_helpers';

describe('Basic grammar', () => {
  test('simple table', async () => {
    const result = await parseWithTreeSitter('Users');
    expect(result.success).toBe(true);
  });

  test('table with where', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18');
    expect(result.success).toBe(true);
  });

  test('table with project', async () => {
    const result = await parseWithTreeSitter('Users | project name, email');
    expect(result.success).toBe(true);
  });

  test('chained operators', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 | project name | take 10');
    expect(result.success).toBe(true);
  });
});
