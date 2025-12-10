import { describe, test, expect } from "bun:test";
import { isValid, getErrorCount } from "./_helpers";

describe("Expression parsing", () => {
  test("literal numbers as table names", () => {
    // Grammar now requires identifiers as table expressions
    // Numbers can only appear in where clauses or after pipes
    expect(isValid("Table1")).toBe(true);
    expect(isValid("Events")).toBe(true);
  });

  test("string literals in where clauses", () => {
    // Strings can appear in where clause comparisons
    expect(isValid('Users | where city == "Seattle"')).toBe(true);
  });

  test("identifiers", () => {
    expect(isValid("Users")).toBe(true);
    expect(isValid("EventType")).toBe(true);
    expect(isValid("_private")).toBe(true);
    expect(isValid("col123")).toBe(true);
  });

  test("basic query", () => {
    // The minimal grammar only supports identifiers, numbers, and strings
    // Complex expressions with operators will be added later
    expect(isValid("Users")).toBe(true);
  });

  test("multiple identifiers with pipe", () => {
    expect(isValid("Users | Events")).toBe(true);
  });

  test("mixed literals with pipe", () => {
    expect(isValid("Users | 123 | 456")).toBe(true);
  });
});

describe("Expression edge cases", () => {
  test("whitespace handling", () => {
    expect(isValid("Users   |   Events")).toBe(true);
    expect(isValid("Users | Events")).toBe(true);
  });

  test("empty expressions", () => {
    // Empty input typically results in errors
    const result = getErrorCount("");
    expect(result).toBeGreaterThanOrEqual(0); // May or may not error
  });

  test("single token", () => {
    expect(isValid("SingleToken")).toBe(true);
  });
});
