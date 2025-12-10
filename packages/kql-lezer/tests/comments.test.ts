import { describe, test, expect } from "bun:test";
import { isValid, getTokens } from "./_helpers";

describe("Comment parsing", () => {
  test("line comment after code", () => {
    expect(isValid("Users // this is a comment")).toBe(true);
  });

  test("line comment with special characters after code", () => {
    expect(isValid("Users // comment with !@#$%^&*()")).toBe(true);
  });

  test("multiple line comments", () => {
    const query = `
      Users
      // first comment
      | Events
      // second comment
      | Logs
      // third comment
    `;
    expect(isValid(query)).toBe(true);
  });

  test("comment at end of line", () => {
    expect(isValid("Users | Events // connected tables")).toBe(true);
  });

  test("comment with KQL keywords", () => {
    expect(isValid("Users // where, project, filter are operators")).toBe(true);
  });
});

describe("Comment token extraction", () => {
  test("comment tokens are identified", () => {
    const tokens = getTokens("Users // comment");
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBeGreaterThan(0);
  });

  test("comment content is preserved", () => {
    const tokens = getTokens("// my comment");
    const comment = tokens.find((t) => t.type === "comment");
    expect(comment?.value).toContain("// my comment");
  });

  test("comment position is accurate", () => {
    const query = "Users // comment";
    const tokens = getTokens(query);
    const comment = tokens.find((t) => t.type === "comment");
    expect(comment?.start).toBe(6);
    expect(comment?.end).toBe(query.length);
  });

  test("multiple comments are extracted", () => {
    const query = `
      Users // comment 1
      | where age > 18 // comment 2
    `;
    const tokens = getTokens(query);
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Comment edge cases", () => {
  test("comment with URLs", () => {
    expect(isValid("Users // see https://example.com for details")).toBe(true);
  });

  test("comment with pipes", () => {
    expect(isValid("Users // | pipe character in comment")).toBe(true);
  });

  test("comment with quotes", () => {
    expect(isValid("Users // comment with \"quotes\" and 'apostrophes'")).toBe(
      true
    );
  });

  test("comment with no trailing code", () => {
    // Our grammar requires at least one expression, comments alone don't count
    // This test documents that behavior
    expect(isValid("//")).toBe(false);
  });

  test("comment with code present", () => {
    expect(
      isValid(`
        Users
        // This is a comment-only query
        // It should still be valid
      `)
    ).toBe(true);
  });
});
