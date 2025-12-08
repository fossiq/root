import { describe, test, expect } from 'bun:test';
import { parseWithTreeSitter } from './_helpers';

describe('Comments', () => {
  test('line comment at start', async () => {
    const result = await parseWithTreeSitter('// This is a comment\nUsers | where age > 18');
    expect(result.success).toBe(true);
  });

  test('inline line comment', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 // filter adults');
    expect(result.success).toBe(true);
  });

  test('multiple line comments', async () => {
    const result = await parseWithTreeSitter(`// Comment 1
// Comment 2
Users | where age > 18`);
    expect(result.success).toBe(true);
  });

  test('block comment single line', async () => {
    const result = await parseWithTreeSitter('Users | where /* inline */ age > 18');
    expect(result.success).toBe(true);
  });

  test('block comment multi-line', async () => {
    const result = await parseWithTreeSitter(`/* This is a
   multi-line
   block comment */
Users | where age > 18`);
    expect(result.success).toBe(true);
  });

  test('block comment between pipes', async () => {
    const result = await parseWithTreeSitter(`Users
/* comment here */
| where age > 18
| project name, email`);
    expect(result.success).toBe(true);
  });

  test('mixed comments', async () => {
    const result = await parseWithTreeSitter(`// Line comment at start
Users | where age > 18 // inline comment
/* Block comment
   spanning lines */
| project name, email`);
    expect(result.success).toBe(true);
  });

  test('comment with special characters', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 // TODO: fix this!!!');
    expect(result.success).toBe(true);
  });
});
