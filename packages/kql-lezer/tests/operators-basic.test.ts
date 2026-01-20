import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("KQL operators - Basic support", () => {
  test("basic table reference", () => {
    expect(isValid("Users")).toBe(true);
  });

  test("identifiers with where clauses", () => {
    expect(isValid("Users | where status == active")).toBe(true);
    expect(isValid('Events | where type == "error"')).toBe(true);
  });

  test("multiple tokens with pipes", () => {
    expect(isValid("Users | Events")).toBe(true);
    expect(isValid("Users | 42 | Events")).toBe(true);
  });
});

describe("Pipe operator support", () => {
  test("single pipe with identifiers", () => {
    expect(isValid("Users | Events")).toBe(true);
  });

  test("pipe chaining identifiers", () => {
    expect(isValid("Users | Events")).toBe(true);
    expect(isValid("Table1 | Table2")).toBe(true);
  });

  test("pipe with where clauses", () => {
    expect(isValid('Events | where type == "error" | Logs')).toBe(true);
  });

  test("multiple pipes (chained)", () => {
    expect(isValid("Users | Events | Logs")).toBe(true);
  });

  test("multiple pipes with mixed literals", () => {
    expect(isValid("Users | 42 | Events")).toBe(true);
  });

  test("pipe with complex identifiers", () => {
    expect(isValid("UsersTable | EventsLog")).toBe(true);
  });
});
