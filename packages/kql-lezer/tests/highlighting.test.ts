import { describe, test, expect } from "vitest";
import { getTokens } from "./_helpers";

describe("Syntax highlighting tokens", () => {
  test("extracts identifier tokens", () => {
    const tokens = getTokens("Users");
    const identifiers = tokens.filter((t) => t.type === "identifier");
    expect(identifiers.length).toBeGreaterThan(0);
    expect(identifiers[0].value).toBe("Users");
  });

  test("extracts number tokens", () => {
    const tokens = getTokens("123");
    const numbers = tokens.filter((t) => t.type === "number");
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers[0].value).toBe("123");
  });

  test("extracts string tokens", () => {
    const tokens = getTokens('"hello world"');
    const strings = tokens.filter((t) => t.type === "string");
    expect(strings.length).toBeGreaterThan(0);
  });

  test("extracts comment tokens", () => {
    const tokens = getTokens("// this is a comment");
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBeGreaterThan(0);
  });

  test("preserves token positions", () => {
    const tokens = getTokens("Users");
    if (tokens.length > 0) {
      const token = tokens[0];
      expect(token.start).toBe(0);
      expect(token.end).toBeGreaterThan(token.start);
    }
  });

  test("handles mixed content", () => {
    const tokens = getTokens("Users | where age > 18 // comment");
    expect(tokens.length).toBeGreaterThan(0);

    const hasIdentifiers = tokens.some((t) => t.type === "identifier");
    const hasNumbers = tokens.some((t) => t.type === "number");
    const hasComments = tokens.some((t) => t.type === "comment");

    expect(hasIdentifiers).toBe(true);
    expect(hasNumbers).toBe(true);
    expect(hasComments).toBe(true);
  });
});
