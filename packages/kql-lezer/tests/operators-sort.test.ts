import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("Sort operator", () => {
  test("simple sort", () => {
    expect(isValid("Users | sort name")).toBe(true);
    expect(isValid("Users | sort by name")).toBe(true);
  });

  test("sort with direction", () => {
    expect(isValid("Users | sort name asc")).toBe(true);
    expect(isValid("Users | sort by name desc")).toBe(true);
  });

  test("sort multiple columns", () => {
    expect(isValid("Users | sort name, age desc")).toBe(true);
  });
});

describe("Limit and take operators", () => {
  test("limit", () => {
    expect(isValid("Users | limit 10")).toBe(true);
  });

  test("take", () => {
    expect(isValid("Users | take 100")).toBe(true);
  });
});

describe("Top operator", () => {
  test("top with count", () => {
    expect(isValid("Users | top 10 by age")).toBe(true);
  });

  test("top with direction", () => {
    expect(isValid("Users | top 5 by score desc")).toBe(true);
  });
});
