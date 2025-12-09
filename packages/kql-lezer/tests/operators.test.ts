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

describe("Where operator", () => {
  test("simple comparison", () => {
    expect(isValid("Users | where age > 18")).toBe(true);
    expect(isValid("Users | where count >= 100")).toBe(true);
    expect(isValid("Users | where status == active")).toBe(true);
    expect(isValid('Users | where name == "john"')).toBe(true);
  });

  test("logical and", () => {
    expect(isValid('Users | where age > 18 and status == "active"')).toBe(true);
    expect(isValid("Users | where a == 1 and b == 2 and c == 3")).toBe(true);
  });

  test("logical or", () => {
    expect(isValid("Users | where age > 18 or age < 5")).toBe(true);
    expect(isValid("Users | where a == 1 or b == 2 or c == 3")).toBe(true);
  });

  test("logical not", () => {
    expect(isValid("Users | where not active")).toBe(true);
    expect(isValid("Users | where not deleted")).toBe(true);
  });

  test("parenthesized expressions", () => {
    expect(isValid("Users | where (age > 18)")).toBe(true);
    expect(
      isValid(
        'Users | where age > 18 and (status == "active" or role == "admin")'
      )
    ).toBe(true);
  });

  test("string comparison operators", () => {
    expect(isValid('Users | where name contains "john"')).toBe(true);
    expect(isValid('Users | where name startswith "j"')).toBe(true);
    expect(isValid('Users | where name endswith "n"')).toBe(true);
    expect(isValid('Users | where name has "test"')).toBe(true);
  });

  test("chained where clauses", () => {
    expect(isValid('Users | where age > 18 | where status == "active"')).toBe(
      true
    );
  });
});

describe("Project operator", () => {
  test("single column", () => {
    expect(isValid("Users | project name")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Users | project name, age")).toBe(true);
    expect(isValid("Users | project name, age, status")).toBe(true);
  });

  test("column with alias", () => {
    expect(isValid("Users | project fullName = name")).toBe(true);
  });

  test("column with computed expression", () => {
    expect(isValid("Users | project name, isAdult = age > 18")).toBe(true);
  });

  test("chained with where", () => {
    expect(isValid("Users | where age > 18 | project name")).toBe(true);
    expect(
      isValid("Users | where active | project name, age | where age > 21")
    ).toBe(true);
  });
});

describe("Operator support (to be expanded)", () => {
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
