import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

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

describe("Extend operator", () => {
  test("single column", () => {
    expect(isValid("Users | extend fullName = name")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Users | extend fullName = name, isAdult = age > 18")).toBe(
      true
    );
  });
});
