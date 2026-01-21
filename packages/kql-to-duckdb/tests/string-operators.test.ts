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

  test("in", () => {
    expect(kqlToDuckDB("Users | where age in (18, 21, 25)")).toContain(
      "age IN (18, 21, 25)"
    );
  });

  test("!in", () => {
    expect(kqlToDuckDB("Users | where age !in (18, 21, 25)")).toContain(
      "age NOT IN (18, 21, 25)"
    );
  });

  test("in with strings", () => {
    expect(kqlToDuckDB('Users | where name in ("Alice", "Bob")')).toContain(
      "name IN ('Alice', 'Bob')"
    );
  });

  test("!in with strings", () => {
    expect(kqlToDuckDB('Users | where name !in ("Alice", "Bob")')).toContain(
      "name NOT IN ('Alice', 'Bob')"
    );
  });
});
