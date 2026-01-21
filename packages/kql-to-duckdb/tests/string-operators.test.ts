import { describe, test, expect } from "bun:test";
import { kqlToDuckDB } from "../src/index";

describe("String operators", () => {
  test("contains", () => {
    expect(kqlToDuckDB('Users | where name contains "test"')).toContain(
      "name LIKE '%test%'"
    );
  });

  test("!contains", () => {
    expect(kqlToDuckDB('Users | where name !contains "test"')).toContain(
      "name NOT LIKE '%test%'"
    );
  });

  test("startswith", () => {
    expect(kqlToDuckDB('Users | where name startswith "j"')).toContain(
      "name LIKE 'j%'"
    );
  });

  test("!startswith", () => {
    expect(kqlToDuckDB('Users | where name !startswith "j"')).toContain(
      "name NOT LIKE 'j%'"
    );
  });

  test("endswith", () => {
    expect(kqlToDuckDB('Users | where name endswith "com"')).toContain(
      "name LIKE '%com'"
    );
  });

  test("!endswith", () => {
    expect(kqlToDuckDB('Users | where name !endswith "com"')).toContain(
      "name NOT LIKE '%com'"
    );
  });

  test("has", () => {
    expect(kqlToDuckDB('Users | where name has "word"')).toContain(
      "name REGEXP '\\bword\\b'"
    );
  });

  test("!has", () => {
    expect(kqlToDuckDB('Users | where name !has "word"')).toContain(
      "name NOT REGEXP '\\bword\\b'"
    );
  });
});
