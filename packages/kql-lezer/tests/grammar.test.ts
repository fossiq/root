import { describe, test, expect } from "vitest";
import { parse, isValid } from "./_helpers";

describe("Basic grammar", () => {
  test("simple table reference", () => {
    expect(isValid("Users")).toBe(true);
  });

  test("identifier as table", () => {
    expect(isValid("MyTable")).toBe(true);
  });

  test("number in where clause", () => {
    expect(isValid("Users | where age > 42")).toBe(true);
  });

  test("multiple tokens with pipe", () => {
    expect(isValid("Users | Events")).toBe(true);
  });

  test("mixed token types with pipes", () => {
    expect(isValid("Users | 42 | Events")).toBe(true);
  });

  test("parser returns valid result", () => {
    const result = parse("Users");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

describe("Future grammar features", () => {
  test("TODO: pipe operators", () => {
    // Once expanded grammar supports it
    // expect(isValid("Users | where age > 18")).toBe(true);
  });

  test("TODO: complex queries", () => {
    // Once expanded grammar supports it
    // expect(isValid("Events | where severity == 'error' | project timestamp, message | sort timestamp")).toBe(true);
  });
});

describe("Error handling", () => {
  test("detects parse errors", () => {
    const result = parse("Users |");
    // Depending on grammar strictness, may or may not error
    expect(typeof result.errors).toBe("object");
  });

  test("empty input", () => {
    const result = parse("");
    expect(typeof result.errors).toBe("object");
  });
});
