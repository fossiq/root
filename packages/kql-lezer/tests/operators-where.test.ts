import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

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
    expect(isValid('Users | where name matches regex "^john"')).toBe(true);
  });

  test("chained where clauses", () => {
    expect(isValid('Users | where age > 18 | where status == "active"')).toBe(
      true
    );
  });
});
