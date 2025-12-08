#!/usr/bin/env bun
/**
 * Grammar Test Script
 * Tests KQL grammar by parsing sample queries and checking for errors
 */

import { $ } from 'bun';
import { writeFileSync, unlinkSync } from 'fs';

interface TestCase {
  name: string;
  query: string;
}

const testCases: TestCase[] = [
  // Basic queries
  { name: 'Simple table', query: 'Users' },
  { name: 'Where clause', query: 'Users | where age > 18' },
  { name: 'Project clause', query: 'Users | project name, email' },

  // Operators
  { name: 'Extend clause', query: 'Users | extend full_name = strcat(first, last)' },
  { name: 'Sort clause', query: 'Users | sort by age' },
  { name: 'Order clause', query: 'Users | order by age desc' },
  { name: 'Take clause', query: 'Users | take 10' },
  { name: 'Limit clause', query: 'Users | limit 100' },
  { name: 'Distinct clause', query: 'Users | distinct' },
  { name: 'Distinct with columns', query: 'Users | distinct name, country' },
  { name: 'Count clause', query: 'Users | count' },
  { name: 'Top clause', query: 'Users | top 5 by age desc' },
  { name: 'Search clause', query: 'Users | search "test"' },
  { name: 'Summarize simple', query: 'Users | summarize count()' },
  { name: 'Summarize by single column', query: 'Users | summarize count() by country' },
  { name: 'Summarize by multiple columns', query: 'Users | summarize count() by country, city' },
  { name: 'Summarize named aggregation', query: 'Users | summarize total = sum(amount) by category' },
  { name: 'Summarize multiple aggregations', query: 'Users | summarize total = sum(amount), avg_price = avg(price) by category' },
  { name: 'Summarize with expression', query: 'Users | summarize max(age), min(age) by country' },

  // Join operator
  { name: 'Join simple', query: 'Users | join Orders on userId' },
  { name: 'Join with kind', query: 'Users | join kind=inner Orders on userId' },
  { name: 'Join leftouter', query: 'Users | join kind=leftouter (Orders) on userId' },
  { name: 'Join with $left/$right', query: 'Users | join Orders on $left.id == $right.userId' },
  { name: 'Join multiple conditions', query: 'Users | join Orders on userId, country' },
  { name: 'Join leftanti', query: 'Users | join kind=leftanti Orders on id' },
  { name: 'Join rightouter', query: 'Users | join kind=rightouter Orders on customerId' },

  // Union operator
  { name: 'Union simple', query: 'Users | union Orders' },
  { name: 'Union multiple tables', query: 'Users | union Orders, Products, Categories' },
  { name: 'Union with kind', query: 'Users | union kind=inner Orders' },
  { name: 'Union outer', query: 'Users | union kind=outer Orders, Products' },
  { name: 'Union isfuzzy', query: 'Users | union isfuzzy=true Orders' },
  { name: 'Union full options', query: 'Users | union kind=outer isfuzzy=false Orders, Logs' },

  // Parse operator (simplified - full pattern parsing to be implemented later)
  { name: 'Parse simple', query: 'Users | parse message with "pattern"' },
  { name: 'Parse with kind', query: 'Users | parse kind=simple message with "error pattern"' },
  { name: 'Parse regex', query: 'Users | parse kind=regex log with "(?P<status>\\d+)"' },

  // MV-expand operator
  { name: 'MV-expand simple', query: 'Users | mv-expand tags' },
  { name: 'MV-expand with typeof', query: 'Users | mv-expand tags to typeof(string)' },
  { name: 'MV-expand with limit', query: 'Users | mvexpand items limit 10' },
  { name: 'MV-expand full', query: 'Users | mv-expand values to typeof(long) limit 100' },

  // Let statements
  { name: 'Let simple', query: 'let x = 10; Users | where age > x' },
  { name: 'Let string', query: 'let name = "John"; Users | where username == name' },
  { name: 'Let function', query: 'let result = count(); Users | summarize result' },
  { name: 'Multiple let', query: 'let a = 1; let b = 2; Users | extend sum = a + b' },

  // Conditional expressions
  { name: 'Iff expression', query: 'Users | extend status = iff(age > 18, "adult", "minor")' },
  { name: 'Case expression', query: 'Users | extend level = case(score > 90, "A", score > 80, "B", "C")' },
  { name: 'Iff in where', query: 'Users | where iff(active == true, age > 18, age > 21)' },

  // Function named arguments
  { name: 'Function named arg', query: 'Users | extend result = substring(text, start=0, length=5)' },
  { name: 'Function mixed args', query: 'Users | extend formatted = strcat(first, last, separator=" ")' },
  { name: 'Function all named', query: 'Users | extend parsed = parse_json(input=data, strict=true)' },

  // Column prefixes (qualified identifiers)
  { name: 'Qualified identifier', query: 'Users | where Users.age > 18' },
  { name: 'Qualified in project', query: 'Users | project Users.name, Users.email' },

  // Type casting
  { name: 'Type cast double colon', query: 'Users | extend age_str = age::string' },
  { name: 'Type cast to function', query: 'Users | extend num = tolong(value)' },
  { name: 'Type cast in where', query: 'Users | where id::string == "123"' },

  // Dynamic/JSON literals
  { name: 'Dynamic array', query: 'Users | extend items = dynamic([1, 2, 3])' },
  { name: 'Dynamic number', query: 'Users | extend value = dynamic(42)' },

  // Expressions
  { name: 'Binary expression', query: 'Users | where age > 18 and country == "US"' },
  { name: 'Comparison expression', query: 'Users | where id == 123' },
  { name: 'Arithmetic expression', query: 'Users | extend total = price * quantity' },
  { name: 'String expression', query: 'Users | where name contains "john"' },
  { name: 'In expression', query: 'Users | where id in (1, 2, 3)' },
  { name: 'Between expression', query: 'Users | where age between (18 .. 65)' },
  { name: 'Parenthesized expression', query: 'Users | where (age > 18 and age < 65)' },

  // Function calls
  { name: 'Function call', query: 'Users | extend upper_name = toupper(name)' },
  { name: 'Function with multiple args', query: 'Users | extend full = strcat(first, last)' },
  { name: 'Function in where', query: 'Users | where strlen(email) > 10' },
  { name: 'Function in comparison', query: 'Users | where now() > timestamp' },
  { name: 'Nested function calls', query: 'Users | extend result = toupper(substring(name, 0, 5))' },

  // Literals
  { name: 'String literal', query: 'Users | where name == "test"' },
  { name: 'Number literal', query: 'Users | where age == 25' },
  { name: 'Boolean literal', query: 'Users | where active == true' },
  { name: 'Null literal', query: 'Users | where email == null' },

  // DateTime and TimeSpan
  { name: 'TimeSpan days', query: 'Users | where timestamp > ago(1d)' },
  { name: 'TimeSpan hours', query: 'Users | where timestamp > ago(2h)' },
  { name: 'TimeSpan minutes', query: 'Users | where timestamp > ago(30m)' },
  { name: 'TimeSpan seconds', query: 'Users | where duration > 45s' },
  { name: 'TimeSpan milliseconds', query: 'Users | where latency < 500ms' },
  { name: 'TimeSpan decimal', query: 'Users | extend duration = 2.5h' },
  { name: 'DateTime function', query: 'Users | where timestamp > datetime("2023-12-07")' },
  { name: 'TimeSpan arithmetic', query: 'Users | extend deadline = timestamp + 7d' },

  // Arrays
  { name: 'Array literal numbers', query: 'Users | extend numbers = [1, 2, 3]' },
  { name: 'Array literal strings', query: 'Users | extend tags = ["tag1", "tag2"]' },
  { name: 'Empty array', query: 'Users | extend empty = []' },
  { name: 'Array with expressions', query: 'Users | extend values = [x + 1, y * 2]' },
  { name: 'Nested arrays', query: 'Users | extend matrix = [[1, 2], [3, 4]]' },
  { name: 'Array in function', query: 'Users | extend data = dynamic([1, 2, 3])' },

  // Complex queries
  { name: 'Multiple pipes', query: 'Users | where age > 18 | project name, email | take 10' },
  { name: 'Complex where', query: 'Users | where age > 18 and (country == "US" or country == "UK")' },
  { name: 'Multiple extends', query: 'Users | extend a = 1, b = 2, c = a + b' },
];

async function runTest(testCase: TestCase): Promise<{ success: boolean; error?: string; output?: string }> {
  const tempFile = '.test-query.kql';

  try {
    writeFileSync(tempFile, testCase.query);

    // Add timeout to prevent hanging
    const timeout = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Test timed out after 5 seconds')), 5000)
    );

    const parsePromise = $`bun x tree-sitter-cli parse ${tempFile}`.text();

    const result = await Promise.race([parsePromise, timeout]);

    const hasError = result.includes('(ERROR');

    return {
      success: !hasError,
      error: hasError ? 'Parse error detected' : undefined,
      output: hasError ? result : undefined
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n⚠️  Error running test "${testCase.name}":`);
    console.error(`   Query: ${testCase.query}`);
    console.error(`   Error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg
    };
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {}
  }
}

async function main() {
  console.log('🧪 Running KQL Grammar Tests\n');

  let passed = 0;
  let failed = 0;
  const failures: Array<{ name: string; error: string }> = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);

    if (result.success) {
      passed++;
      console.log(`✅ ${testCase.name}`);
    } else {
      failed++;
      console.log(`❌ ${testCase.name}`);
      console.log(`   Query: ${testCase.query}`);
      if (result.output) {
        console.log(`   Parse output:\n${result.output}`);
      }
      failures.push({ name: testCase.name, error: result.error || 'Unknown error' });
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failures.length > 0) {
    console.log('\n❌ Failed tests summary:');
    failures.forEach(f => {
      console.log(`\n  Test: ${f.name}`);
      console.log(`  Error: ${f.error}`);
    });
    process.exit(1);
  }

  console.log('\n✨ All tests passed!');
}

main();
