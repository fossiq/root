import { describe, test, expect } from 'bun:test';
import { parseWithTreeSitter } from './_helpers';

describe('Expressions', () => {
  test('binary and expression', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 and country == "US"');
    expect(result.success).toBe(true);
  });

  test('binary or expression', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 or retired == true');
    expect(result.success).toBe(true);
  });

  test('comparison expression', async () => {
    const result = await parseWithTreeSitter('Users | where id == 123');
    expect(result.success).toBe(true);
  });

  test('arithmetic expression', async () => {
    const result = await parseWithTreeSitter('Users | extend total = price * quantity');
    expect(result.success).toBe(true);
  });

  test('string contains', async () => {
    const result = await parseWithTreeSitter('Users | where name contains "john"');
    expect(result.success).toBe(true);
  });

  test('in expression', async () => {
    const result = await parseWithTreeSitter('Users | where id in (1, 2, 3)');
    expect(result.success).toBe(true);
  });

  test('between expression', async () => {
    const result = await parseWithTreeSitter('Users | where age between (18 .. 65)');
    expect(result.success).toBe(true);
  });

  test('parenthesized expression', async () => {
    const result = await parseWithTreeSitter('Users | where (age > 18 and age < 65)');
    expect(result.success).toBe(true);
  });

  test('iff expression', async () => {
    const result = await parseWithTreeSitter('Users | extend status = iff(age > 18, "adult", "minor")');
    expect(result.success).toBe(true);
  });

  test('case expression', async () => {
    const result = await parseWithTreeSitter('Users | extend level = case(score > 90, "A", score > 80, "B", "C")');
    expect(result.success).toBe(true);
  });

  test('type cast double colon', async () => {
    const result = await parseWithTreeSitter('Users | extend age_str = age::string');
    expect(result.success).toBe(true);
  });

  test('qualified identifier', async () => {
    const result = await parseWithTreeSitter('Users | where Users.age > 18');
    expect(result.success).toBe(true);
  });
});

describe('Function calls', () => {
  test('simple function', async () => {
    const result = await parseWithTreeSitter('Users | extend upper_name = toupper(name)');
    expect(result.success).toBe(true);
  });

  test('multiple arguments', async () => {
    const result = await parseWithTreeSitter('Users | extend full = strcat(first, last)');
    expect(result.success).toBe(true);
  });

  test('nested functions', async () => {
    const result = await parseWithTreeSitter('Users | extend result = toupper(substring(name, 0, 5))');
    expect(result.success).toBe(true);
  });

  test('named arguments', async () => {
    const result = await parseWithTreeSitter('Users | extend result = substring(text, start=0, length=5)');
    expect(result.success).toBe(true);
  });

  test('mixed arguments', async () => {
    const result = await parseWithTreeSitter('Users | extend formatted = strcat(first, last, separator=" ")');
    expect(result.success).toBe(true);
  });
});

describe('Literals', () => {
  test('string literal', async () => {
    const result = await parseWithTreeSitter('Users | where name == "test"');
    expect(result.success).toBe(true);
  });

  test('number literal', async () => {
    const result = await parseWithTreeSitter('Users | where age == 25');
    expect(result.success).toBe(true);
  });

  test('boolean true', async () => {
    const result = await parseWithTreeSitter('Users | where active == true');
    expect(result.success).toBe(true);
  });

  test('boolean false', async () => {
    const result = await parseWithTreeSitter('Users | where deleted == false');
    expect(result.success).toBe(true);
  });

  test('null literal', async () => {
    const result = await parseWithTreeSitter('Users | where email == null');
    expect(result.success).toBe(true);
  });

  test('dynamic array', async () => {
    const result = await parseWithTreeSitter('Users | extend items = dynamic([1, 2, 3])');
    expect(result.success).toBe(true);
  });

  test('array literal', async () => {
    const result = await parseWithTreeSitter('Users | extend numbers = [1, 2, 3]');
    expect(result.success).toBe(true);
  });

  test('empty array', async () => {
    const result = await parseWithTreeSitter('Users | extend empty = []');
    expect(result.success).toBe(true);
  });

  test('nested arrays', async () => {
    const result = await parseWithTreeSitter('Users | extend matrix = [[1, 2], [3, 4]]');
    expect(result.success).toBe(true);
  });

  test('timespan days', async () => {
    const result = await parseWithTreeSitter('Users | where timestamp > ago(1d)');
    expect(result.success).toBe(true);
  });

  test('timespan hours', async () => {
    const result = await parseWithTreeSitter('Users | where timestamp > ago(2h)');
    expect(result.success).toBe(true);
  });

  test('timespan minutes', async () => {
    const result = await parseWithTreeSitter('Users | where timestamp > ago(30m)');
    expect(result.success).toBe(true);
  });

  test('datetime function', async () => {
    const result = await parseWithTreeSitter('Users | where timestamp > datetime("2023-12-07")');
    expect(result.success).toBe(true);
  });
});

describe('Let statements', () => {
  test('let with number', async () => {
    const result = await parseWithTreeSitter('let x = 10; Users | where age > x');
    expect(result.success).toBe(true);
  });

  test('let with string', async () => {
    const result = await parseWithTreeSitter('let name = "John"; Users | where username == name');
    expect(result.success).toBe(true);
  });

  test('multiple let statements', async () => {
    const result = await parseWithTreeSitter('let a = 1; let b = 2; Users | extend sum = a + b');
    expect(result.success).toBe(true);
  });
});

describe('Complex queries', () => {
  test('multiple pipes', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 | project name, email | take 10');
    expect(result.success).toBe(true);
  });

  test('complex where with parentheses', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18 and (country == "US" or country == "UK")');
    expect(result.success).toBe(true);
  });

  test('multiple extends', async () => {
    const result = await parseWithTreeSitter('Users | extend a = 1, b = 2, c = a + b');
    expect(result.success).toBe(true);
  });
});
