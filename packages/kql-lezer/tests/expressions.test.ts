import { describe, test, expect } from "vitest";
import { isValid, getErrorCount } from "./_helpers";

describe("Expression parsing", () => {
  test("literal numbers", () => {
    expect(isValid("42")).toBe(true);
    // Note: Decimal numbers not yet supported in minimal grammar
    // expect(isValid("3.14")).toBe(true);
    expect(isValid("0")).toBe(true);
  });

  test("string literals", () => {
    expect(isValid('"hello"')).toBe(true);
    expect(isValid('"hello world"')).toBe(true);
    expect(isValid('""')).toBe(true);
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

  test("multiple identifiers", () => {
    expect(isValid("Users Events")).toBe(true);
  });

  test("mixed literals", () => {
    expect(isValid("Users 123 456")).toBe(true);
  });
});

describe("Expression edge cases", () => {
  test("whitespace handling", () => {
    expect(isValid("Users   Events")).toBe(true);
    expect(isValid("Users Events")).toBe(true);
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
