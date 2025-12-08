import { describe, test, expect } from 'bun:test';
import { parseWithTreeSitter } from './_helpers';

describe('Operators', () => {
  test('where clause', async () => {
    const result = await parseWithTreeSitter('Users | where age > 18');
    expect(result.success).toBe(true);
  });

  test('project clause', async () => {
    const result = await parseWithTreeSitter('Users | project name, email');
    expect(result.success).toBe(true);
  });

  test('extend clause', async () => {
    const result = await parseWithTreeSitter('Users | extend full_name = strcat(first, last)');
    expect(result.success).toBe(true);
  });

  test('sort clause', async () => {
    const result = await parseWithTreeSitter('Users | sort by age');
    expect(result.success).toBe(true);
  });

  test('order by desc', async () => {
    const result = await parseWithTreeSitter('Users | order by age desc');
    expect(result.success).toBe(true);
  });

  test('take clause', async () => {
    const result = await parseWithTreeSitter('Users | take 10');
    expect(result.success).toBe(true);
  });

  test('limit clause', async () => {
    const result = await parseWithTreeSitter('Users | limit 100');
    expect(result.success).toBe(true);
  });

  test('distinct without columns', async () => {
    const result = await parseWithTreeSitter('Users | distinct');
    expect(result.success).toBe(true);
  });

  test('distinct with columns', async () => {
    const result = await parseWithTreeSitter('Users | distinct name, country');
    expect(result.success).toBe(true);
  });

  test('count clause', async () => {
    const result = await parseWithTreeSitter('Users | count');
    expect(result.success).toBe(true);
  });

  test('top clause', async () => {
    const result = await parseWithTreeSitter('Users | top 5 by age desc');
    expect(result.success).toBe(true);
  });

  test('search clause', async () => {
    const result = await parseWithTreeSitter('Users | search "test"');
    expect(result.success).toBe(true);
  });

  test('summarize simple', async () => {
    const result = await parseWithTreeSitter('Users | summarize count()');
    expect(result.success).toBe(true);
  });

  test('summarize by single column', async () => {
    const result = await parseWithTreeSitter('Users | summarize count() by country');
    expect(result.success).toBe(true);
  });

  test('summarize by multiple columns', async () => {
    const result = await parseWithTreeSitter('Users | summarize count() by country, city');
    expect(result.success).toBe(true);
  });

  test('summarize named aggregation', async () => {
    const result = await parseWithTreeSitter('Users | summarize total = sum(amount) by category');
    expect(result.success).toBe(true);
  });

  test('summarize multiple aggregations', async () => {
    const result = await parseWithTreeSitter('Users | summarize total = sum(amount), avg_price = avg(price) by category');
    expect(result.success).toBe(true);
  });

  test('join simple', async () => {
    const result = await parseWithTreeSitter('Users | join Orders on userId');
    expect(result.success).toBe(true);
  });

  test('join with kind', async () => {
    const result = await parseWithTreeSitter('Users | join kind=inner Orders on userId');
    expect(result.success).toBe(true);
  });

  test('join leftouter', async () => {
    const result = await parseWithTreeSitter('Users | join kind=leftouter (Orders) on userId');
    expect(result.success).toBe(true);
  });

  test('join with $left/$right', async () => {
    const result = await parseWithTreeSitter('Users | join Orders on $left.id == $right.userId');
    expect(result.success).toBe(true);
  });

  test('join multiple conditions', async () => {
    const result = await parseWithTreeSitter('Users | join Orders on userId, country');
    expect(result.success).toBe(true);
  });

  test('union simple', async () => {
    const result = await parseWithTreeSitter('Users | union Orders');
    expect(result.success).toBe(true);
  });

  test('union multiple tables', async () => {
    const result = await parseWithTreeSitter('Users | union Orders, Products, Categories');
    expect(result.success).toBe(true);
  });

  test('union with kind', async () => {
    const result = await parseWithTreeSitter('Users | union kind=inner Orders');
    expect(result.success).toBe(true);
  });

  test('union with isfuzzy', async () => {
    const result = await parseWithTreeSitter('Users | union isfuzzy=true Orders');
    expect(result.success).toBe(true);
  });

  test('parse simple', async () => {
    const result = await parseWithTreeSitter('Users | parse message with "pattern"');
    expect(result.success).toBe(true);
  });

  test('parse with kind', async () => {
    const result = await parseWithTreeSitter('Users | parse kind=simple message with "error pattern"');
    expect(result.success).toBe(true);
  });

  test('mv-expand simple', async () => {
    const result = await parseWithTreeSitter('Users | mv-expand tags');
    expect(result.success).toBe(true);
  });

  test('mv-expand with typeof', async () => {
    const result = await parseWithTreeSitter('Users | mv-expand tags to typeof(string)');
    expect(result.success).toBe(true);
  });

  test('mv-expand with limit', async () => {
    const result = await parseWithTreeSitter('Users | mvexpand items limit 10');
    expect(result.success).toBe(true);
  });
});
