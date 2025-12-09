import { describe, test, expect } from "vitest";
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
    // Current minimal grammar supports basic token sequences with pipes
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

describe("Where operator support", () => {
  test("where with greater than comparison", () => {
    expect(isValid("Users | where age > 18")).toBe(true);
  });

  test("where with less than comparison", () => {
    expect(isValid("Users | where count < 100")).toBe(true);
  });

  test("where with equality comparison", () => {
    expect(isValid("Users | where status == active")).toBe(true);
  });

  test("where with string literal comparison", () => {
    expect(isValid('Users | where city == "Seattle"')).toBe(true);
  });

  test("where with not equal comparison", () => {
    expect(isValid("Users | where level != 0")).toBe(true);
  });

  test("where with greater than or equal", () => {
    expect(isValid("Users | where salary >= 50000")).toBe(true);
  });

  test("where with less than or equal", () => {
    expect(isValid("Users | where age <= 65")).toBe(true);
  });

  test("chained where operators", () => {
    expect(isValid("Users | where age > 18 | where status == active")).toBe(
      true
    );
  });

  test("where followed by pipe to another table", () => {
    expect(isValid("Users | where age > 18 | Events")).toBe(true);
  });
});

describe("Operator support (to be expanded)", () => {
  test("future: project operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | project name")).toBe(true);
  });

  test("future: chained where and project", () => {
    // Once grammar is expanded
    // expect(isValid("Users | where age > 18 | project name")).toBe(true);
  });

  test("future: filter operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | filter severity == 'error'")).toBe(true);
  });

  test("future: summarize operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | summarize count()")).toBe(true);
  });

  test("future: sort operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | sort name")).toBe(true);
  });

  test("future: limit operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | limit 10")).toBe(true);
  });

  test("future: distinct operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | distinct EventType")).toBe(true);
  });

  test("future: union operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | union Admin")).toBe(true);
  });
});
